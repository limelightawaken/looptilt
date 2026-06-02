import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { ReaderFingerprintController } from './reader-fingerprint.controller';
import { ReaderFingerprintService } from './reader-fingerprint.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ReaderFingerprintController],
  providers: [ReaderFingerprintService],
  exports: [ReaderFingerprintService],
})
export class ReaderFingerprintsModule {}
