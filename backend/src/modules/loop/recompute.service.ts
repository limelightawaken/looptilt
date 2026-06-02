import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { ReaderFingerprintService } from '../reader-fingerprints/reader-fingerprint.service';
import { SegmentsService } from '../segments/segments.service';

export interface RecomputeResult {
  readersUpdated: number;
  segments: number;
  memberships: number;
}

/**
 * Orchestrates one full pass of the re-segmentation loop for a newsletter:
 * recompute every reader fingerprint, then re-evaluate segment membership
 * (and write tags back to Kit for live connections).
 */
@Injectable()
export class RecomputeService {
  private readonly logger = new Logger(RecomputeService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly readerFingerprintService: ReaderFingerprintService,
    private readonly segmentsService: SegmentsService,
  ) {}

  async recompute(newsletterId: string): Promise<RecomputeResult> {
    const readers = await this.readerFingerprintService.recomputeForNewsletter(newsletterId);
    const segments = await this.segmentsService.reassignAll(newsletterId);
    return {
      readersUpdated: readers.updated,
      segments: segments.segments,
      memberships: segments.memberships,
    };
  }

  async recomputeForOwner(userId: string, newsletterId: string): Promise<RecomputeResult> {
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
    return this.recompute(newsletterId);
  }

  async recomputeAll(): Promise<void> {
    const connections = await this.database.espConnection.findMany({
      where: { isActive: true },
      select: { newsletterId: true },
    });
    for (const connection of connections) {
      try {
        await this.recompute(connection.newsletterId);
      } catch (error) {
        this.logger.warn(`Scheduled recompute failed for ${connection.newsletterId}: ${String(error)}`);
      }
    }
  }
}
