import { Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { RecomputeService } from './recompute.service';

@ApiTags('loop')
@ApiBearerAuth()
@Controller('newsletters/:newsletterId/loop')
export class LoopController {
  constructor(private readonly recomputeService: RecomputeService) {}

  @Post('recompute')
  @ApiOperation({
    summary: 'Run the re-segmentation loop now',
    description: 'Recomputes reader fingerprints and re-evaluates segment membership.',
  })
  @ApiParam({ name: 'newsletterId', description: 'Newsletter ID' })
  recompute(@Session() session: UserSession, @Param('newsletterId') newsletterId: string) {
    return this.recomputeService.recomputeForOwner(session.user.id, newsletterId);
  }
}
