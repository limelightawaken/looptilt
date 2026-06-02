import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { ReaderFingerprintService } from './reader-fingerprint.service';

@ApiTags('readers')
@ApiBearerAuth()
@Controller('newsletters/:newsletterId/readers')
export class ReaderFingerprintController {
  constructor(private readonly readerFingerprintService: ReaderFingerprintService) {}

  @Get()
  @ApiOperation({ summary: 'List subscribers with their computed reader fingerprint' })
  @ApiParam({ name: 'newsletterId', description: 'Newsletter ID' })
  list(@Session() session: UserSession, @Param('newsletterId') newsletterId: string) {
    return this.readerFingerprintService.listReaders(session.user.id, newsletterId);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Aggregate signal insights (lifecycle mix, churn, topic engagement)' })
  insights(@Session() session: UserSession, @Param('newsletterId') newsletterId: string) {
    return this.readerFingerprintService.getInsights(session.user.id, newsletterId);
  }
}
