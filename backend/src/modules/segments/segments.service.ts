import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReaderFingerprint, Segment, SegmentKind, Subscriber } from '@prisma/client';
import { DatabaseService } from '../../common/database/database.service';
import { AiService } from '../ai/ai.service';
import { EspAdapterFactory } from '../esp/esp-adapter.factory';
import { SegmentRule } from '../ai/types/ai.types';
import { evaluateSegmentRule } from './segment-evaluator';
import { CreateSegmentDto, PreviewSegmentDto } from './dto/segment.dto';

type SubscriberWithFingerprint = Subscriber & { fingerprint: ReaderFingerprint | null };

interface DefaultDefinition {
  name: string;
  kind: SegmentKind;
  description: string;
  rule: SegmentRule;
}

/**
 * Owns segments: the zero-setup defaults, AI-built custom segments, membership
 * assignment from reader fingerprints, and write-back of segment tags to Kit
 * (LIVE_KIT only).
 */
@Injectable()
export class SegmentsService {
  private readonly logger = new Logger(SegmentsService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly aiService: AiService,
    private readonly adapterFactory: EspAdapterFactory,
  ) {}

  async listSegments(userId: string, newsletterId: string) {
    await this.verifyOwnership(userId, newsletterId);
    await this.ensureDefaultSegments(newsletterId);
    const segments = await this.database.segment.findMany({
      where: { newsletterId },
      orderBy: [{ kind: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { memberships: true } } },
    });
    return segments;
  }

  async previewCustomSegment(userId: string, newsletterId: string, dto: PreviewSegmentDto) {
    await this.verifyOwnership(userId, newsletterId);
    const topics = await this.database.newsletterTopic.findMany({ where: { newsletterId } });
    const channels = await this.distinctChannels(newsletterId);
    const proposal = await this.aiService.proposeSegment({
      description: dto.description,
      topics: topics.map((t) => t.slug),
      acquisitionChannels: channels,
    });
    const estimatedCount = await this.countMatches(newsletterId, proposal.rule);
    return { ...proposal, estimatedCount };
  }

  async createCustomSegment(userId: string, newsletterId: string, dto: CreateSegmentDto) {
    await this.verifyOwnership(userId, newsletterId);
    const segment = await this.database.segment.create({
      data: {
        newsletterId,
        name: dto.name,
        kind: 'CUSTOM',
        description: dto.description,
        rationale: dto.rationale,
        definition: dto.rule as unknown as Prisma.InputJsonValue,
      },
    });
    await this.reassignAll(newsletterId);
    return segment;
  }

  async deleteSegment(userId: string, newsletterId: string, segmentId: string): Promise<void> {
    await this.verifyOwnership(userId, newsletterId);
    const segment = await this.database.segment.findFirst({
      where: { id: segmentId, newsletterId },
    });
    if (!segment) {
      throw new NotFoundException(`Segment ${segmentId} not found`);
    }
    await this.database.segment.delete({ where: { id: segmentId } });
  }

  async ensureDefaultSegments(newsletterId: string): Promise<void> {
    const existing = await this.database.segment.count({
      where: { newsletterId, kind: { not: 'CUSTOM' } },
    });
    if (existing > 0) {
      return;
    }
    const topics = await this.database.newsletterTopic.findMany({
      where: { newsletterId },
      orderBy: { weight: 'desc' },
      take: 3,
    });
    const definitions = this.buildDefaultDefinitions(topics.map((t) => ({ name: t.name, slug: t.slug })));
    await this.database.segment.createMany({
      data: definitions.map((def) => ({
        newsletterId,
        name: def.name,
        kind: def.kind,
        description: def.description,
        definition: def.rule as unknown as Prisma.InputJsonValue,
      })),
    });
  }

  async reassignAll(newsletterId: string): Promise<{ segments: number; memberships: number }> {
    const connection = await this.database.espConnection.findUnique({ where: { newsletterId } });
    if (!connection) {
      return { segments: 0, memberships: 0 };
    }
    await this.ensureDefaultSegments(newsletterId);
    const [segments, subscribers] = await Promise.all([
      this.database.segment.findMany({ where: { newsletterId, isActive: true } }),
      this.database.subscriber.findMany({
        where: { newsletterId, source: connection.dataSource },
        include: { fingerprint: true },
      }),
    ]);
    let membershipCount = 0;
    for (const segment of segments) {
      membershipCount += await this.assignSegment(segment, subscribers);
    }
    if (connection.dataSource === 'LIVE_KIT') {
      await this.writeBackToKit(newsletterId, connection, segments, subscribers).catch((error) =>
        this.logger.warn(`Kit write-back failed: ${String(error)}`),
      );
    }
    return { segments: segments.length, memberships: membershipCount };
  }

  private async assignSegment(
    segment: Segment,
    subscribers: SubscriberWithFingerprint[],
  ): Promise<number> {
    const rule = segment.definition as unknown as SegmentRule | null;
    if (!rule) {
      return 0;
    }
    const matchingIds = subscribers
      .filter((subscriber) => evaluateSegmentRule(rule, subscriber.fingerprint, subscriber))
      .map((subscriber) => subscriber.id);
    // Swap memberships atomically so a crash never leaves a segment empty mid-recompute.
    const ops: Prisma.PrismaPromise<unknown>[] = [
      this.database.segmentMembership.deleteMany({ where: { segmentId: segment.id } }),
    ];
    if (matchingIds.length > 0) {
      ops.push(
        this.database.segmentMembership.createMany({
          data: matchingIds.map((subscriberId) => ({ segmentId: segment.id, subscriberId })),
          skipDuplicates: true,
        }),
      );
    }
    await this.database.$transaction(ops);
    return matchingIds.length;
  }

  private async writeBackToKit(
    newsletterId: string,
    connection: Prisma.EspConnectionGetPayload<object>,
    segments: Segment[],
    subscribers: SubscriberWithFingerprint[],
  ): Promise<void> {
    const adapter = this.adapterFactory.create(connection);
    const subscriberById = new Map(subscribers.map((s) => [s.id, s]));
    for (const segment of segments) {
      const tagId = segment.kitTagId ?? (await adapter.ensureTag(`looptilt:${segment.name}`));
      if (!segment.kitTagId) {
        await this.database.segment.update({ where: { id: segment.id }, data: { kitTagId: tagId } });
      }
      const memberships = await this.database.segmentMembership.findMany({
        where: { segmentId: segment.id },
      });
      for (const membership of memberships) {
        const subscriber = subscriberById.get(membership.subscriberId);
        if (subscriber?.espSubscriberId) {
          await adapter.tagSubscriber(tagId, subscriber.espSubscriberId).catch(() => undefined);
        }
      }
    }
  }

  private async countMatches(newsletterId: string, rule: SegmentRule): Promise<number> {
    const connection = await this.database.espConnection.findUnique({ where: { newsletterId } });
    const subscribers = await this.database.subscriber.findMany({
      where: { newsletterId, source: connection?.dataSource ?? 'SIMULATOR' },
      include: { fingerprint: true },
    });
    return subscribers.filter((subscriber) =>
      evaluateSegmentRule(rule, subscriber.fingerprint, subscriber),
    ).length;
  }

  private async distinctChannels(newsletterId: string): Promise<string[]> {
    const rows = await this.database.subscriber.findMany({
      where: { newsletterId, channel: { not: null } },
      select: { channel: true },
      distinct: ['channel'],
    });
    return rows.map((row) => row.channel as string);
  }

  private buildDefaultDefinitions(topics: { name: string; slug: string }[]): DefaultDefinition[] {
    const lifecycle: DefaultDefinition[] = [
      { name: 'New readers', kind: 'DEFAULT_LIFECYCLE', description: 'Recently joined, still warming up.', rule: { match: 'all', conditions: [{ field: 'lifecycleStage', operator: 'eq', value: 'NEW' }] } },
      { name: 'Engaged readers', kind: 'DEFAULT_LIFECYCLE', description: 'Consistently opening and clicking.', rule: { match: 'all', conditions: [{ field: 'lifecycleStage', operator: 'eq', value: 'ENGAGED' }] } },
      { name: 'Cooling (churn risk)', kind: 'DEFAULT_LIFECYCLE', description: 'Engagement is declining - intervene first here.', rule: { match: 'all', conditions: [{ field: 'lifecycleStage', operator: 'eq', value: 'COOLING' }] } },
      { name: 'Dormant', kind: 'DEFAULT_LIFECYCLE', description: 'Gone quiet for a while.', rule: { match: 'all', conditions: [{ field: 'lifecycleStage', operator: 'eq', value: 'DORMANT' }] } },
      { name: 'Reactivated', kind: 'DEFAULT_LIFECYCLE', description: 'Came back after going quiet.', rule: { match: 'all', conditions: [{ field: 'lifecycleStage', operator: 'eq', value: 'REACTIVATED' }] } },
    ];
    const depth: DefaultDefinition[] = [
      { name: 'Skimmers', kind: 'DEFAULT_DEPTH', description: 'Prefer quick takes.', rule: { match: 'all', conditions: [{ field: 'depthPreference', operator: 'eq', value: 'SKIMMER' }] } },
      { name: 'Deep readers', kind: 'DEFAULT_DEPTH', description: 'Read all the way down.', rule: { match: 'all', conditions: [{ field: 'depthPreference', operator: 'eq', value: 'DEEP' }] } },
    ];
    const affinity: DefaultDefinition[] = topics.map((topic) => ({
      name: `Loves ${topic.name}`,
      kind: 'DEFAULT_AFFINITY',
      description: `High affinity for ${topic.name}.`,
      rule: { match: 'all', conditions: [{ field: 'topicAffinity', topicName: topic.slug, operator: 'gte', value: 0.5 }] },
    }));
    return [...lifecycle, ...depth, ...affinity];
  }

  private async verifyOwnership(userId: string, newsletterId: string): Promise<void> {
    const newsletter = await this.database.newsletter.findUnique({
      where: { id: newsletterId },
      select: { userId: true },
    });
    if (!newsletter) {
      throw new NotFoundException(`Newsletter ${newsletterId} not found`);
    }
    if (newsletter.userId !== userId) {
      throw new ForbiddenException('You do not have access to this newsletter');
    }
  }
}
