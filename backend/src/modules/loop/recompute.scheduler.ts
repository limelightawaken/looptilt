import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RECOMPUTE_ALL_JOB, RECOMPUTE_CRON, RECOMPUTE_QUEUE } from './recompute.constants';

/**
 * Registers the hourly re-segmentation recompute as a BullMQ repeatable job.
 * The PRD describes this as the scheduled recompute that turns the append-only
 * event stream into the per-reader matrix; running it through Redis/BullMQ keeps
 * the schedule durable and reliable across restarts and multiple instances.
 */
@Injectable()
export class RecomputeScheduler implements OnModuleInit {
  private readonly logger = new Logger(RecomputeScheduler.name);

  constructor(@InjectQueue(RECOMPUTE_QUEUE) private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      RECOMPUTE_ALL_JOB,
      {},
      {
        repeat: { pattern: RECOMPUTE_CRON },
        jobId: RECOMPUTE_ALL_JOB,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
    this.logger.log('Scheduled hourly re-segmentation recompute job');
  }
}
