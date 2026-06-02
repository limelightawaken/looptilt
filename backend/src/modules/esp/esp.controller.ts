import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { EspConnectionService } from './esp-connection.service';
import { ConnectEspDto } from './dto/connect-esp.dto';

@ApiTags('esp')
@ApiBearerAuth()
@Controller('newsletters/:newsletterId/esp')
export class EspController {
  constructor(private readonly connectionService: EspConnectionService) {}

  @Get()
  @ApiOperation({ summary: 'Get ESP connection status and data-source mode' })
  @ApiParam({ name: 'newsletterId', description: 'Newsletter ID' })
  getStatus(@Session() session: UserSession, @Param('newsletterId') newsletterId: string) {
    return this.connectionService.getStatus(session.user.id, newsletterId);
  }

  @Post('connect')
  @ApiOperation({
    summary: 'Connect Kit (live) or enable demo data mode',
    description: 'LIVE_KIT verifies the API key and registers webhooks. SIMULATOR is dev-only.',
  })
  connect(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Body() dto: ConnectEspDto,
  ) {
    return this.connectionService.connect(session.user.id, newsletterId, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Disconnect the ESP connection' })
  disconnect(@Session() session: UserSession, @Param('newsletterId') newsletterId: string) {
    return this.connectionService.disconnect(session.user.id, newsletterId);
  }
}
