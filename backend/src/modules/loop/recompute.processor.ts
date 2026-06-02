import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RECOMPUTE_QUEUE } from './recompute.constants';
import { RecomputeService } from './recompute.service';

/**
 * BullMQ worker that runs the re-segmentation recompute pass off the request
 * path. Backed by Redis so scheduled work survives restarts and is retried on
 * failure instead of being lost like the previous in-process cron.
 */
@Processor(RECOMPUTE_QUEUE)
export class RecomputeProcessor extends WorkerHost {
  private readonly logger = new Logger(RecomputeProcessor.name);

  constructor(private readonly recomputeService: RecomputeService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Running re-segmentation recompute job ${job.name}`);
    await this.recomputeService.recomputeAll();
  }
}
