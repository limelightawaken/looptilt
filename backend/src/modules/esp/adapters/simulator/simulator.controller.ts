import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { SimulatorGuard } from './simulator.guard';
import { SimulatorService } from './simulator.service';
import { GenerateSignalsDto, SeedSubscribersDto } from './dto/simulate.dto';

@ApiTags('simulator')
@ApiBearerAuth()
@UseGuards(SimulatorGuard)
@Controller('newsletters/:newsletterId/simulator')
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Post('seed')
  @ApiOperation({ summary: '[dev only] Seed demo subscribers (SIMULATOR mode)' })
  @ApiParam({ name: 'newsletterId', description: 'Newsletter ID' })
  seed(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Body() dto: SeedSubscribersDto,
  ) {
    return this.simulatorService.seed(session.user.id, newsletterId, dto.subscriberCount ?? 60);
  }

  @Post('generate')
  @ApiOperation({ summary: '[dev only] Generate a realistic signal stream (SIMULATOR mode)' })
  generate(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Body() dto: GenerateSignalsDto,
  ) {
    return this.simulatorService.generateSignals(session.user.id, newsletterId, dto.issues ?? 10);
  }
}
