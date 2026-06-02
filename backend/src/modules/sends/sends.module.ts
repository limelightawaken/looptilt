import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { GhostwriterModule } from '../ghostwriter/ghostwriter.module';
import { EspModule } from '../esp/esp.module';
import { SendsController } from './sends.controller';
import { SendsService } from './sends.service';

@Module({
  imports: [DatabaseModule, GhostwriterModule, EspModule],
  controllers: [SendsController],
  providers: [SendsService],
  exports: [SendsService],
})
export class SendsModule {}
