import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { SendsService } from './sends.service';
import { CreateSendDto } from './dto/create-send.dto';

@ApiTags('sends')
@ApiBearerAuth()
@Controller('newsletters/:newsletterId/sends')
export class SendsController {
  constructor(private readonly sendsService: SendsService) {}

  @Get()
  @ApiOperation({ summary: 'List sends with their per-segment variants' })
  @ApiParam({ name: 'newsletterId', description: 'Newsletter ID' })
  list(@Session() session: UserSession, @Param('newsletterId') newsletterId: string) {
    return this.sendsService.list(session.user.id, newsletterId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a draft issue (add content blocks, then generate)' })
  create(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Body() dto: CreateSendDto,
  ) {
    return this.sendsService.create(session.user.id, newsletterId, dto);
  }

  @Post(':sendId/generate')
  @ApiOperation({
    summary: "Generate one voice-preserving variant per segment from the issue's blocks",
  })
  generate(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Param('sendId') sendId: string,
  ) {
    return this.sendsService.generate(session.user.id, newsletterId, sendId);
  }

  @Get(':sendId')
  @ApiOperation({ summary: 'Get a send and its variants' })
  get(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Param('sendId') sendId: string,
  ) {
    return this.sendsService.get(session.user.id, newsletterId, sendId);
  }

  @Post(':sendId/push-to-kit')
  @ApiOperation({
    summary: 'Push variants to Kit as draft broadcasts (Live mode only)',
    description: 'Creates one Kit broadcast per variant as a draft. Never sends to the whole list.',
  })
  pushToKit(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Param('sendId') sendId: string,
  ) {
    return this.sendsService.pushToKit(session.user.id, newsletterId, sendId);
  }
}
