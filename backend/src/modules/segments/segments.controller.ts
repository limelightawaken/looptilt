import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { SegmentsService } from './segments.service';
import { CreateSegmentDto, PreviewSegmentDto } from './dto/segment.dto';

@ApiTags('segments')
@ApiBearerAuth()
@Controller('newsletters/:newsletterId/segments')
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List segments (defaults + custom) with member counts' })
  @ApiParam({ name: 'newsletterId', description: 'Newsletter ID' })
  list(@Session() session: UserSession, @Param('newsletterId') newsletterId: string) {
    return this.segmentsService.listSegments(session.user.id, newsletterId);
  }

  @Post('preview')
  @ApiOperation({
    summary: 'Preview an AI-built segment from a plain-language description',
    description: 'Returns the proposed rule, rationale, excluded signals, and a live match count.',
  })
  preview(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Body() dto: PreviewSegmentDto,
  ) {
    return this.segmentsService.previewCustomSegment(session.user.id, newsletterId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Save a custom segment (after inspecting the proposed rule)' })
  create(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Body() dto: CreateSegmentDto,
  ) {
    return this.segmentsService.createCustomSegment(session.user.id, newsletterId, dto);
  }

  @Delete(':segmentId')
  @ApiOperation({ summary: 'Delete a segment' })
  remove(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Param('segmentId') segmentId: string,
  ) {
    return this.segmentsService.deleteSegment(session.user.id, newsletterId, segmentId);
  }
}
