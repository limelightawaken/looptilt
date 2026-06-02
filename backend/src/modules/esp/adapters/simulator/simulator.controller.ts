import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { SimulatorGuard } from './simulator.guard';
import { SimulatorService } from './simulator.service';
import { SeedDemoDto } from './dto/simulate.dto';

@ApiTags('simulator')
@ApiBearerAuth()
@UseGuards(SimulatorGuard)
@Controller('newsletters/:newsletterId/simulator')
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Post('seed')
  @ApiOperation({
    summary:
      '[dev only] Seed full demo state (archive, fingerprint topics, subscribers, signals, loop recompute)',
  })
  @ApiParam({ name: 'newsletterId', description: 'Newsletter ID' })
  seed(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Body() dto: SeedDemoDto,
  ) {
    return this.simulatorService.seed(
      session.user.id,
      newsletterId,
      dto.subscriberCount ?? 60,
      dto.issues ?? 10,
    );
  }
}
