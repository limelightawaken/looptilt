import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { EspModule } from '../esp/esp.module';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';

@Module({
  imports: [DatabaseModule, EspModule],
  controllers: [SegmentsController],
  providers: [SegmentsService],
  exports: [SegmentsService],
})
export class SegmentsModule {}
