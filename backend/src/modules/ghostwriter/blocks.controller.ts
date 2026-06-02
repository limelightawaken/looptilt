import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { BlocksService } from './blocks.service';
import { CreateContentBlockDto, UpdateContentBlockDto } from './dto/content-block.dto';

@ApiTags('ghostwriter')
@ApiBearerAuth()
@Controller('newsletters/:newsletterId/sends/:sendId/blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  @ApiOperation({ summary: 'List the content blocks for an issue' })
  @ApiParam({ name: 'newsletterId', description: 'Newsletter ID' })
  @ApiParam({ name: 'sendId', description: 'Send (issue) ID' })
  list(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Param('sendId') sendId: string,
  ) {
    return this.blocksService.list(session.user.id, newsletterId, sendId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a content block to an issue' })
  create(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Param('sendId') sendId: string,
    @Body() dto: CreateContentBlockDto,
  ) {
    return this.blocksService.create(session.user.id, newsletterId, sendId, dto);
  }

  @Patch(':blockId')
  @ApiOperation({ summary: 'Update a content block' })
  update(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Param('sendId') sendId: string,
    @Param('blockId') blockId: string,
    @Body() dto: UpdateContentBlockDto,
  ) {
    return this.blocksService.update(session.user.id, newsletterId, sendId, blockId, dto);
  }

  @Delete(':blockId')
  @ApiOperation({ summary: 'Delete a content block' })
  remove(
    @Session() session: UserSession,
    @Param('newsletterId') newsletterId: string,
    @Param('sendId') sendId: string,
    @Param('blockId') blockId: string,
  ) {
    return this.blocksService.remove(session.user.id, newsletterId, sendId, blockId);
  }
}
