import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '../../common/database/database.module';
import { ReaderFingerprintsModule } from '../reader-fingerprints/reader-fingerprints.module';
import { SegmentsModule } from '../segments/segments.module';
import { RecomputeService } from './recompute.service';
import { RecomputeScheduler } from './recompute.scheduler';
import { RecomputeProcessor } from './recompute.processor';
import { RECOMPUTE_QUEUE } from './recompute.constants';
import { LoopController } from './loop.controller';

@Module({
  imports: [
    DatabaseModule,
    ReaderFingerprintsModule,
    SegmentsModule,
    BullModule.registerQueue({ name: RECOMPUTE_QUEUE }),
  ],
  controllers: [LoopController],
  providers: [RecomputeService, RecomputeScheduler, RecomputeProcessor],
  exports: [RecomputeService],
})
export class LoopModule {}
