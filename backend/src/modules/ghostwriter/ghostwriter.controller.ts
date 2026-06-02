import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { GhostwriterService } from './ghostwriter.service';
import { CreateGhostwriterDraftDto } from './dto/create-ghostwriter-draft.dto';

@ApiTags('ghostwriter')
@ApiBearerAuth()
@Controller('newsletters/:newsletterId/drafts')
export class GhostwriterController {
  constructor(private readonly ghostwriterService: GhostwriterService) {}

  @Get()
  @ApiOperation({ summary: 'List ghostwriter drafts for a newsletter' })
  list(@Session() session: UserSession, @Param('newsletterId') newsletterId: string) {
    return this.ghostwriterService.listForNewsletter(session.user.id, newsletterId);
  }

  @Post()
  @ApiOperation({
    summary: 'Generate a voice-preserving draft from fingerprint + outline',
    description:
      'Uses the newsletter fingerprint to assemble a draft scaffold in the creator\'s inferred voice. v2 will produce per-reader variants for the re-segmentation loop.',
  })
  @ApiResponse({ status: 201, description: 'Draft created' })
  @ApiResponse({ status: 400, description: 'Fingerprint not ready' })
  create(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Body() dto: CreateGhostwriterDraftDto,
  ) {
    return this.ghostwriterService.create(session.user.id, newsletterId, dto);
  }

  @Get(':draftId')
  @ApiOperation({ summary: 'Get a single ghostwriter draft' })
  @ApiParam({ name: 'draftId', description: 'Draft ID' })
  findOne(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Param('draftId') draftId: string,
  ) {
    return this.ghostwriterService.findOne(session.user.id, newsletterId, draftId);
  }
}
