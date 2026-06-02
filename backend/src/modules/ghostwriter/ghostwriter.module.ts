import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { GhostwriterController } from './ghostwriter.controller';
import { GhostwriterService } from './ghostwriter.service';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { AssemblyService } from './assembly.service';

@Module({
  imports: [DatabaseModule],
  controllers: [GhostwriterController, BlocksController],
  providers: [GhostwriterService, BlocksService, AssemblyService],
  exports: [GhostwriterService, AssemblyService],
})
export class GhostwriterModule {}
