import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentBlock } from '@prisma/client';
import { DatabaseService } from '../../common/database/database.service';
import { CreateContentBlockDto, UpdateContentBlockDto } from './dto/content-block.dto';

/**
 * Manages an issue's content blocks. Blocks are scoped to a single send (issue)
 * and can be raw copy, links, images, promotions, or author instructions. The
 * loop selects and orders them per segment so the creator never hand-writes a
 * variant.
 */
@Injectable()
export class BlocksService {
  constructor(private readonly database: DatabaseService) {}

  async list(userId: string, newsletterId: string, sendId: string): Promise<ContentBlock[]> {
    await this.verifySend(userId, newsletterId, sendId);
    return this.database.contentBlock.findMany({
      where: { sendId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(
    userId: string,
    newsletterId: string,
    sendId: string,
    dto: CreateContentBlockDto,
  ): Promise<ContentBlock> {
    await this.verifySend(userId, newsletterId, sendId);
    return this.database.contentBlock.create({
      data: {
        sendId,
        kind: dto.kind ?? 'CONTENT',
        label: dto.label,
        intent: dto.intent,
        body: dto.body,
        url: dto.url,
        topicId: dto.topicId,
        order: dto.order ?? 0,
      },
    });
  }

  async update(
    userId: string,
    newsletterId: string,
    sendId: string,
    blockId: string,
    dto: UpdateContentBlockDto,
  ): Promise<ContentBlock> {
    await this.verifySend(userId, newsletterId, sendId);
    await this.findBlock(sendId, blockId);
    return this.database.contentBlock.update({ where: { id: blockId }, data: dto });
  }

  async remove(
    userId: string,
    newsletterId: string,
    sendId: string,
    blockId: string,
  ): Promise<void> {
    await this.verifySend(userId, newsletterId, sendId);
    await this.findBlock(sendId, blockId);
    await this.database.contentBlock.delete({ where: { id: blockId } });
  }

  private async findBlock(sendId: string, blockId: string): Promise<ContentBlock> {
    const block = await this.database.contentBlock.findFirst({
      where: { id: blockId, sendId },
    });
    if (!block) {
      throw new NotFoundException(`Content block ${blockId} not found`);
    }
    return block;
  }

  private async verifySend(userId: string, newsletterId: string, sendId: string): Promise<void> {
    const send = await this.database.send.findFirst({
      where: { id: sendId, newsletterId },
      select: { id: true, newsletter: { select: { userId: true } } },
    });
    if (!send) {
      throw new NotFoundException(`Send ${sendId} not found`);
    }
    if (send.newsletter.userId !== userId) {
      throw new ForbiddenException('You do not have access to this newsletter');
    }
  }
}
