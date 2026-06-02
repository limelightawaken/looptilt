import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { NewslettersController } from './newsletters.controller';
import { NewslettersService } from './newsletters.service';

@Module({
  imports: [DatabaseModule],
  controllers: [NewslettersController],
  providers: [NewslettersService],
  exports: [NewslettersService],
})
export class NewslettersModule {}
