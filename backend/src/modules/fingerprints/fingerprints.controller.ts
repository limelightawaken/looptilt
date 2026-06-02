import { Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { FingerprintsService } from './fingerprints.service';

@ApiTags('fingerprints')
@ApiBearerAuth()
@Controller('newsletters/:newsletterId/fingerprint')
export class FingerprintsController {
  constructor(private readonly fingerprintsService: FingerprintsService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current newsletter fingerprint' })
  @ApiParam({ name: 'newsletterId', description: 'Newsletter ID' })
  getFingerprint(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
  ) {
    return this.fingerprintsService.getForNewsletter(session.user.id, newsletterId);
  }

  @Post('generate')
  @ApiOperation({
    summary: 'Generate or refresh the newsletter fingerprint from archive',
    description:
      'Analyzes archived issues to produce a structured fingerprint (topics, voice, audience, depth, obsessions). Production deployments swap the heuristic engine for LLM-backed analysis.',
  })
  @ApiResponse({ status: 200, description: 'Fingerprint generated successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient archive data' })
  generate(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
  ) {
    return this.fingerprintsService.generate(session.user.id, newsletterId);
  }
}
