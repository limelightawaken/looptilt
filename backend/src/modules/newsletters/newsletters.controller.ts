import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { NewslettersService } from './newsletters.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import { AddArchiveIssueDto } from './dto/add-archive-issue.dto';

@ApiTags('newsletters')
@ApiBearerAuth()
@Controller('newsletters')
export class NewslettersController {
  constructor(private readonly newslettersService: NewslettersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a newsletter workspace' })
  @ApiResponse({ status: 201, description: 'Newsletter created' })
  create(@Session() session: UserSession, @Body() dto: CreateNewsletterDto) {
    return this.newslettersService.create(session.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List newsletters for the current creator' })
  findAll(@Session() session: UserSession) {
    return this.newslettersService.findAllForUser(session.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a newsletter with archive, fingerprint, and drafts' })
  @ApiParam({ name: 'id', description: 'Newsletter ID' })
  findOne(@Session() session: UserSession, @Param('id') id: string) {
    return this.newslettersService.findOneForUser(session.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update newsletter metadata' })
  update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateNewsletterDto,
  ) {
    return this.newslettersService.update(session.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a newsletter and all related data' })
  remove(@Session() session: UserSession, @Param('id') id: string) {
    return this.newslettersService.remove(session.user.id, id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Add a past issue to the archive for fingerprinting' })
  addArchiveIssue(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: AddArchiveIssueDto,
  ) {
    return this.newslettersService.addArchiveIssue(session.user.id, id, dto);
  }

  @Delete(':id/archive/:issueId')
  @ApiOperation({ summary: 'Remove an issue from the archive' })
  removeArchiveIssue(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Param('issueId') issueId: string,
  ) {
    return this.newslettersService.removeArchiveIssue(session.user.id, id, issueId);
  }
}
