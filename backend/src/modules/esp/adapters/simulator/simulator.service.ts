import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NewsletterTopic, Prisma, SignalType, Subscriber } from '@prisma/client';
import { DatabaseService } from '../../../../common/database/database.service';

const CHANNELS = ['referral', 'recommendation', 'social', 'organic', 'paid'];
const FIRST_NAMES = ['Alex', 'Sam', 'Jordan', 'Riley', 'Casey', 'Taylor', 'Morgan', 'Jamie'];
type Trajectory = 'rising' | 'stable' | 'declining';
const TRAJECTORIES: Trajectory[] = ['rising', 'stable', 'declining'];
const MS_PER_DAY = 86_400_000;

export interface SeedResult {
  created: number;
}

export interface GenerateResult {
  subscribers: number;
  events: number;
  issues: number;
}

/**
 * Local signal simulator (development only). Seeds subscribers and emits a
 * realistic stream of opens, topic-encoded clicks, and explicit signals, all
 * stamped source=SIMULATOR, so the full loop can run without a live Kit list.
 */
@Injectable()
export class SimulatorService {
  constructor(private readonly database: DatabaseService) {}

  async seed(userId: string, newsletterId: string, subscriberCount: number): Promise<SeedResult> {
    await this.verifySimulatorNewsletter(userId, newsletterId);
    const count = Math.min(Math.max(subscriberCount, 1), 500);
    const existing = await this.database.subscriber.count({
      where: { newsletterId, source: 'SIMULATOR' },
    });
    const rows: Prisma.SubscriberCreateManyInput[] = [];
    for (let i = 0; i < count; i += 1) {
      const index = existing + i;
      rows.push({
        newsletterId,
        source: 'SIMULATOR',
        email: `reader${index}@demo.looptilt.dev`,
        firstName: FIRST_NAMES[index % FIRST_NAMES.length],
        channel: CHANNELS[index % CHANNELS.length],
        signupContext: 'demo-seed',
      });
    }
    await this.database.subscriber.createMany({ data: rows, skipDuplicates: true });
    return { created: rows.length };
  }

  async generateSignals(
    userId: string,
    newsletterId: string,
    issues: number,
  ): Promise<GenerateResult> {
    await this.verifySimulatorNewsletter(userId, newsletterId);
    const issueCount = Math.min(Math.max(issues, 1), 30);
    const subscribers = await this.database.subscriber.findMany({
      where: { newsletterId, source: 'SIMULATOR' },
    });
    if (subscribers.length === 0) {
      throw new BadRequestException('Seed demo subscribers before generating signals');
    }
    const topics = await this.database.newsletterTopic.findMany({ where: { newsletterId } });
    if (topics.length === 0) {
      throw new BadRequestException('Generate a fingerprint first so topics exist to map clicks to');
    }
    const events: Prisma.SignalEventCreateManyInput[] = [];
    subscribers.forEach((subscriber, index) => {
      const trajectory = TRAJECTORIES[index % TRAJECTORIES.length];
      const favouriteTopic = topics[index % topics.length];
      this.buildSubscriberEvents({
        subscriber,
        topics,
        favouriteTopic,
        trajectory,
        issueCount,
        newsletterId,
        events,
      });
    });
    await this.database.signalEvent.createMany({ data: events });
    return { subscribers: subscribers.length, events: events.length, issues: issueCount };
  }

  private buildSubscriberEvents(params: {
    subscriber: Subscriber;
    topics: NewsletterTopic[];
    favouriteTopic: NewsletterTopic;
    trajectory: Trajectory;
    issueCount: number;
    newsletterId: string;
    events: Prisma.SignalEventCreateManyInput[];
  }): void {
    const { subscriber, topics, favouriteTopic, trajectory, issueCount, newsletterId, events } =
      params;
    for (let issue = 0; issue < issueCount; issue += 1) {
      const occurredAt = new Date(Date.now() - (issueCount - issue) * 7 * MS_PER_DAY);
      const openProbability = this.openProbability(trajectory, issue, issueCount);
      if (Math.random() > openProbability) {
        continue;
      }
      events.push({
        newsletterId,
        subscriberId: subscriber.id,
        type: SignalType.OPEN,
        source: 'SIMULATOR',
        occurredAt,
      });
      if (Math.random() < 0.55) {
        const clickTopic = Math.random() < 0.7 ? favouriteTopic : this.pick(topics);
        events.push({
          newsletterId,
          subscriberId: subscriber.id,
          type: SignalType.LINK_CLICK,
          source: 'SIMULATOR',
          topicId: clickTopic.id,
          linkUrl: `https://demo.looptilt.dev/i/${issue}?lt=${clickTopic.slug}`,
          position: Math.random() < 0.5 ? 'upper' : 'lower',
          occurredAt,
        });
      }
      if (Math.random() < 0.12) {
        const positive = trajectory !== 'declining';
        events.push({
          newsletterId,
          subscriberId: subscriber.id,
          type: positive ? SignalType.MORE_LIKE_THIS : SignalType.LESS_LIKE_THIS,
          source: 'SIMULATOR',
          topicId: favouriteTopic.id,
          value: positive ? 1 : -1,
          occurredAt,
        });
      }
    }
  }

  private openProbability(trajectory: Trajectory, issue: number, total: number): number {
    const progress = total > 1 ? issue / (total - 1) : 1;
    if (trajectory === 'rising') {
      return 0.3 + 0.6 * progress;
    }
    if (trajectory === 'declining') {
      return 0.85 - 0.7 * progress;
    }
    return 0.6;
  }

  private pick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  private async verifySimulatorNewsletter(userId: string, newsletterId: string): Promise<void> {
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
    if (!newsletter.esp || newsletter.esp.dataSource !== 'SIMULATOR') {
      throw new BadRequestException(
        'The newsletter must be connected in Demo data (SIMULATOR) mode to use the simulator',
      );
    }
  }
}
