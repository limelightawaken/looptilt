import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DataSource,
  DepthPreference,
  LifecycleStage,
  NewsletterTopic,
  Prisma,
  SignalEvent,
  SignalType,
} from '@prisma/client';
import { DatabaseService } from '../../common/database/database.service';
import { ComputedReaderFingerprint, TopicAffinity } from './types/reader-fingerprint.types';

const MS_PER_DAY = 86_400_000;
const WINDOW_DAYS = 84;
const HALF_WINDOW_DAYS = 42;
const ASSUMED_ISSUES = 12;

/**
 * Computes the reader fingerprint for every subscriber of a newsletter from the
 * append-only signal stream. Reads ONLY events whose source matches the
 * connection's data source, so live and simulated data never mix.
 */
@Injectable()
export class ReaderFingerprintService {
  constructor(private readonly database: DatabaseService) {}

  async recomputeForNewsletter(newsletterId: string): Promise<{ updated: number }> {
    const connection = await this.database.espConnection.findUnique({ where: { newsletterId } });
    if (!connection) {
      return { updated: 0 };
    }
    const [subscribers, topics, allEvents] = await Promise.all([
      this.database.subscriber.findMany({
        where: { newsletterId, source: connection.dataSource },
      }),
      this.database.newsletterTopic.findMany({ where: { newsletterId } }),
      this.database.signalEvent.findMany({
        where: { newsletterId, source: connection.dataSource },
        orderBy: { occurredAt: 'asc' },
      }),
    ]);
    const eventsBySubscriber = new Map<string, SignalEvent[]>();
    for (const event of allEvents) {
      const list = eventsBySubscriber.get(event.subscriberId);
      if (list) {
        list.push(event);
      } else {
        eventsBySubscriber.set(event.subscriberId, [event]);
      }
    }
    let updated = 0;
    for (const subscriber of subscribers) {
      const events = eventsBySubscriber.get(subscriber.id) ?? [];
      const computed = this.computeFingerprint(events, topics);
      await this.persist(subscriber.id, computed);
      updated += 1;
    }
    return { updated };
  }

  async listReaders(userId: string, newsletterId: string) {
    const connection = await this.verifyOwnership(userId, newsletterId);
    const source = connection?.dataSource ?? 'SIMULATOR';
    return this.database.subscriber.findMany({
      where: { newsletterId, source },
      include: { fingerprint: true },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
  }

  async getInsights(userId: string, newsletterId: string) {
    const connection = await this.verifyOwnership(userId, newsletterId);
    const source = connection?.dataSource ?? 'SIMULATOR';
    const subscribers = await this.database.subscriber.findMany({
      where: { newsletterId, source },
      include: { fingerprint: true },
    });
    const lifecycleCounts: Record<string, number> = {};
    let churnSum = 0;
    let atRisk = 0;
    let withFingerprint = 0;
    for (const subscriber of subscribers) {
      const fingerprint = subscriber.fingerprint;
      if (!fingerprint) {
        continue;
      }
      withFingerprint += 1;
      lifecycleCounts[fingerprint.lifecycleStage] =
        (lifecycleCounts[fingerprint.lifecycleStage] ?? 0) + 1;
      churnSum += fingerprint.churnPropensity;
      if (fingerprint.churnPropensity >= 0.6) {
        atRisk += 1;
      }
    }
    const topics = await this.database.newsletterTopic.findMany({ where: { newsletterId } });
    const topicEngagement = await this.topicEngagement(newsletterId, source, topics);
    return {
      totalSubscribers: subscribers.length,
      withFingerprint,
      averageChurn: withFingerprint ? Number((churnSum / withFingerprint).toFixed(3)) : 0,
      atRiskCount: atRisk,
      lifecycleCounts,
      topicEngagement,
    };
  }

  private async topicEngagement(
    newsletterId: string,
    source: DataSource,
    topics: NewsletterTopic[],
  ): Promise<Array<{ topic: string; clicks: number }>> {
    const counts = await Promise.all(
      topics.map((topic) =>
        this.database.signalEvent.count({
          where: { newsletterId, source, type: SignalType.LINK_CLICK, topicId: topic.id },
        }),
      ),
    );
    return topics.map((topic, index) => ({ topic: topic.name, clicks: counts[index] }));
  }

  private async verifyOwnership(userId: string, newsletterId: string) {
    const newsletter = await this.database.newsletter.findUnique({
      where: { id: newsletterId },
      select: { userId: true, esp: true },
    });
    if (!newsletter) {
      throw new NotFoundException(`Newsletter ${newsletterId} not found`);
    }
    if (newsletter.userId !== userId) {
      throw new ForbiddenException('You do not have access to this newsletter');
    }
    return newsletter.esp;
  }

  private computeFingerprint(
    events: SignalEvent[],
    topics: NewsletterTopic[],
  ): ComputedReaderFingerprint {
    const now = Date.now();
    const opens = events.filter((e) => e.type === SignalType.OPEN);
    const clicks = events.filter((e) => e.type === SignalType.LINK_CLICK);
    // Kit has no open webhook (kit-api §3), so live data carries clicks but no
    // opens. Degrade gracefully: use opens when present, otherwise treat clicks
    // as the engagement signal so lifecycle/churn stay meaningful in live mode.
    const engagement = opens.length > 0 ? opens : clicks;
    const midpoint = now - HALF_WINDOW_DAYS * MS_PER_DAY;
    const recentEngagement = engagement.filter((e) => e.occurredAt.getTime() >= midpoint).length;
    const earlyEngagement = engagement.filter((e) => e.occurredAt.getTime() < midpoint).length;
    const weeksPerHalf = HALF_WINDOW_DAYS / 7;
    const recentRate = recentEngagement / weeksPerHalf;
    const earlyRate = earlyEngagement / weeksPerHalf;
    const slope = recentRate - earlyRate;
    const openRate = Math.min(engagement.length / ASSUMED_ISSUES, 1);
    const lastEventAt = events.length ? events[events.length - 1].occurredAt.getTime() : 0;
    const firstEventAt = events.length ? events[0].occurredAt.getTime() : now;
    const daysSinceLast = events.length ? (now - lastEventAt) / MS_PER_DAY : Number.POSITIVE_INFINITY;
    const daysSinceFirst = (now - firstEventAt) / MS_PER_DAY;
    return {
      topicAffinities: this.computeAffinities(events, topics, midpoint),
      depthPreference: this.computeDepth(clicks),
      lifecycleStage: this.computeLifecycle({
        signalCount: events.length,
        slope,
        earlyRate,
        openRate,
        daysSinceLast,
        daysSinceFirst,
      }),
      churnPropensity: this.computeChurn(slope, daysSinceLast, events.length),
      openRate: Number(openRate.toFixed(3)),
      signalCount: events.length,
    };
  }

  private computeAffinities(
    events: SignalEvent[],
    topics: NewsletterTopic[],
    midpoint: number,
  ): TopicAffinity[] {
    return topics.map((topic) => {
      const topicEvents = events.filter((e) => e.topicId === topic.id);
      const clicks = topicEvents.filter((e) => e.type === SignalType.LINK_CLICK).length;
      const more = topicEvents.filter((e) => e.type === SignalType.MORE_LIKE_THIS).length;
      const less = topicEvents.filter((e) => e.type === SignalType.LESS_LIKE_THIS).length;
      const raw = clicks * 0.15 + more * 0.4 - less * 0.4;
      const score = Math.max(0, Math.min(1, raw));
      const recentClicks = topicEvents.filter(
        (e) => e.type === SignalType.LINK_CLICK && e.occurredAt.getTime() >= midpoint,
      ).length;
      const earlyClicks = clicks - recentClicks;
      const trend = Number((recentClicks - earlyClicks).toFixed(2));
      return { topicId: topic.id, name: topic.name, slug: topic.slug, score: Number(score.toFixed(3)), trend, clicks };
    });
  }

  private computeDepth(clicks: SignalEvent[]): DepthPreference {
    if (clicks.length < 3) {
      return DepthPreference.UNKNOWN;
    }
    const lower = clicks.filter((e) => e.position === 'lower').length;
    return lower / clicks.length >= 0.5 ? DepthPreference.DEEP : DepthPreference.SKIMMER;
  }

  private computeLifecycle(input: {
    signalCount: number;
    slope: number;
    earlyRate: number;
    openRate: number;
    daysSinceLast: number;
    daysSinceFirst: number;
  }): LifecycleStage {
    if (input.signalCount === 0) {
      return LifecycleStage.NEW;
    }
    if (input.daysSinceLast > 35) {
      return LifecycleStage.DORMANT;
    }
    if (input.slope > 0.15 && input.earlyRate < 0.2) {
      return LifecycleStage.REACTIVATED;
    }
    if (input.slope < -0.15) {
      return LifecycleStage.COOLING;
    }
    if (input.openRate > 0.55) {
      return LifecycleStage.ENGAGED;
    }
    if (input.daysSinceFirst < 21) {
      return LifecycleStage.NEW;
    }
    return LifecycleStage.WARMING;
  }

  private computeChurn(slope: number, daysSinceLast: number, signalCount: number): number {
    if (signalCount === 0) {
      // No engagement history yet (e.g. brand-new reader): no evidence of churn,
      // so do not inflate the at-risk count or the average.
      return 0;
    }
    const slopeComponent = 0.5 - slope * 1.5;
    const recencyPenalty = Math.min(daysSinceLast / 60, 0.3);
    return Number(Math.max(0, Math.min(1, slopeComponent + recencyPenalty)).toFixed(3));
  }

  private async persist(subscriberId: string, computed: ComputedReaderFingerprint): Promise<void> {
    const data = {
      topicAffinities: computed.topicAffinities as unknown as Prisma.InputJsonValue,
      depthPreference: computed.depthPreference,
      lifecycleStage: computed.lifecycleStage,
      churnPropensity: computed.churnPropensity,
      openRate: computed.openRate,
      signalCount: computed.signalCount,
    };
    await this.database.readerFingerprint.upsert({
      where: { subscriberId },
      create: { subscriberId, ...data },
      update: { ...data, version: { increment: 1 }, computedAt: new Date() },
    });
  }
}
