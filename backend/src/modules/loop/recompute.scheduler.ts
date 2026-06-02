import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecomputeService } from './recompute.service';

/**
 * Periodically recomputes reader fingerprints and segment membership for all
 * connected newsletters. The PRD describes this as the scheduled recompute job
 * that turns the append-only event stream into the per-reader matrix.
 */
@Injectable()
export class RecomputeScheduler {
  private readonly logger = new Logger(RecomputeScheduler.name);

  constructor(private readonly recomputeService: RecomputeService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleScheduledRecompute(): Promise<void> {
    this.logger.log('Running scheduled re-segmentation recompute');
    await this.recomputeService.recomputeAll();
  }
}
