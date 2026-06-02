import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { ReaderFingerprintsModule } from '../reader-fingerprints/reader-fingerprints.module';
import { SegmentsModule } from '../segments/segments.module';
import { RecomputeService } from './recompute.service';
import { RecomputeScheduler } from './recompute.scheduler';
import { LoopController } from './loop.controller';

@Module({
  imports: [DatabaseModule, ReaderFingerprintsModule, SegmentsModule],
  controllers: [LoopController],
  providers: [RecomputeService, RecomputeScheduler],
  exports: [RecomputeService],
})
export class LoopModule {}
