import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { FingerprintsController } from './fingerprints.controller';
import { FingerprintsService } from './fingerprints.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FingerprintsController],
  providers: [FingerprintsService],
  exports: [FingerprintsService],
})
export class FingerprintsModule {}
