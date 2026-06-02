import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NewsletterFingerprint, ReaderFingerprint, Segment } from '@prisma/client';
import { DatabaseService } from '../../common/database/database.service';
import { AssemblyService, SegmentProfile } from '../ghostwriter/assembly.service';
import { EspConnectionService } from '../esp/esp-connection.service';
import { EspAdapterFactory } from '../esp/esp-adapter.factory';
import { TopicAffinity } from '../reader-fingerprints/types/reader-fingerprint.types';
import { CreateSendDto } from './dto/create-send.dto';

/**
 * Orchestrates a send: generate one voice-preserving variant per active segment
 * that has members, then (LIVE_KIT only) push each variant to Kit as a draft
 * broadcast targeting that segment's tag. Never auto-sends to the whole list.
 */
@Injectable()
export class SendsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly assemblyService: AssemblyService,
    private readonly connectionService: EspConnectionService,
    private readonly adapterFactory: EspAdapterFactory,
  ) {}

  async list(userId: string, newsletterId: string) {
    await this.verifyOwnership(userId, newsletterId);
    return this.database.send.findMany({
      where: { newsletterId },
      orderBy: { createdAt: 'desc' },
      include: { variants: { include: { segment: true } } },
    });
  }

  async get(userId: string, newsletterId: string, sendId: string) {
    await this.verifyOwnership(userId, newsletterId);
    const send = await this.database.send.findFirst({
      where: { id: sendId, newsletterId },
      include: { variants: { include: { segment: true } } },
    });
    if (!send) {
      throw new NotFoundException(`Send ${sendId} not found`);
    }
    return send;
  }

  async create(userId: string, newsletterId: string, dto: CreateSendDto) {
    await this.verifyOwnership(userId, newsletterId);
    const fingerprint = await this.requireReadyFingerprint(newsletterId);
    const blocks = await this.database.contentBlock.findMany({
      where: { newsletterId },
      orderBy: { order: 'asc' },
    });
    if (blocks.length === 0) {
      throw new BadRequestException('Add at least one content block before composing a send');
    }
    const segments = await this.segmentsWithMembers(newsletterId);
    if (segments.length === 0) {
      throw new BadRequestException('No segments with members yet - run the loop first');
    }
    const topics = await this.database.newsletterTopic.findMany({ where: { newsletterId } });
    const topicNameById = new Map(topics.map((topic) => [topic.id, topic.name]));
    const topicSlugById = new Map(topics.map((topic) => [topic.id, topic.slug]));
    const newsletter = await this.database.newsletter.findUniqueOrThrow({
      where: { id: newsletterId },
      select: { name: true },
    });
    const send = await this.database.send.create({
      data: { newsletterId, title: dto.title, status: 'GENERATING' },
    });
    for (const segment of segments) {
      const profile = await this.computeSegmentProfile(segment.id);
      const content = await this.assemblyService.assembleForSegment({
        newsletterName: newsletter.name,
        fingerprint,
        blocks,
        topicNameById,
        topicSlugById,
        segment,
        profile,
      });
      await this.database.segmentVariant.create({
        data: { sendId: send.id, segmentId: segment.id, content, status: 'GENERATED' },
      });
    }
    await this.database.send.update({ where: { id: send.id }, data: { status: 'READY' } });
    return this.get(userId, newsletterId, send.id);
  }

  async pushToKit(userId: string, newsletterId: string, sendId: string) {
    await this.verifyOwnership(userId, newsletterId);
    const connection = await this.connectionService.requireConnection(newsletterId);
    if (connection.dataSource !== 'LIVE_KIT') {
      throw new BadRequestException(
        'Pushing to Kit is only available in Live (Kit) mode. Demo sends are preview-only.',
      );
    }
    const send = await this.get(userId, newsletterId, sendId);
    const adapter = this.adapterFactory.create(connection);
    await this.database.send.update({ where: { id: sendId }, data: { status: 'PUBLISHING' } });
    let pushed = 0;
    for (const variant of send.variants) {
      if (!variant.segment.kitTagId) {
        // No Kit tag yet means the loop has not written this segment back to Kit.
        await this.database.segmentVariant.update({
          where: { id: variant.id },
          data: { status: 'FAILED' },
        });
        continue;
      }
      const result = await adapter.createBroadcast({
        subject: `${send.title} (${variant.segment.name})`,
        content: variant.content,
        tagId: variant.segment.kitTagId,
        publish: false,
      });
      await this.database.segmentVariant.update({
        where: { id: variant.id },
        data: { kitBroadcastId: result.broadcastId, status: 'PUBLISHED' },
      });
      pushed += 1;
    }
    if (pushed === 0) {
      await this.database.send.update({ where: { id: sendId }, data: { status: 'FAILED' } });
      throw new BadRequestException(
        'No segment has been written back to Kit yet. Run the loop in Live mode so segment tags are created, then push again.',
      );
    }
    await this.database.send.update({ where: { id: sendId }, data: { status: 'PUBLISHED' } });
    return this.get(userId, newsletterId, sendId);
  }

  private async segmentsWithMembers(newsletterId: string): Promise<Segment[]> {
    const segments = await this.database.segment.findMany({
      where: { newsletterId, isActive: true },
      include: { _count: { select: { memberships: true } } },
    });
    return segments.filter((segment) => segment._count.memberships > 0);
  }

  private async computeSegmentProfile(segmentId: string): Promise<SegmentProfile> {
    const memberships = await this.database.segmentMembership.findMany({
      where: { segmentId },
      include: { subscriber: { include: { fingerprint: true } } },
      take: 200,
    });
    const fingerprints = memberships
      .map((m) => m.subscriber.fingerprint)
      .filter((fp): fp is ReaderFingerprint => fp !== null);
    return {
      topAffinities: this.topAffinities(fingerprints),
      depthPreference: this.dominantDepth(fingerprints),
    };
  }

  private topAffinities(fingerprints: ReaderFingerprint[]): string[] {
    const totals = new Map<string, number>();
    for (const fingerprint of fingerprints) {
      const affinities = (fingerprint.topicAffinities as unknown as TopicAffinity[]) ?? [];
      for (const affinity of affinities) {
        totals.set(affinity.name, (totals.get(affinity.name) ?? 0) + affinity.score);
      }
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([name]) => name);
  }

  private dominantDepth(fingerprints: ReaderFingerprint[]): string {
    const counts: Record<string, number> = {};
    for (const fingerprint of fingerprints) {
      counts[fingerprint.depthPreference] = (counts[fingerprint.depthPreference] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? 'UNKNOWN';
  }

  private async requireReadyFingerprint(newsletterId: string): Promise<NewsletterFingerprint> {
    const fingerprint = await this.database.newsletterFingerprint.findUnique({
      where: { newsletterId },
    });
    if (!fingerprint || fingerprint.status !== 'READY') {
      throw new BadRequestException('Generate a fingerprint before composing a send');
    }
    return fingerprint;
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
