import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { GhostwriterController } from './ghostwriter.controller';
import { GhostwriterService } from './ghostwriter.service';

@Module({
  imports: [DatabaseModule],
  controllers: [GhostwriterController],
  providers: [GhostwriterService],
  exports: [GhostwriterService],
})
export class GhostwriterModule {}
