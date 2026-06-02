import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentBlock } from '@prisma/client';
import { DatabaseService } from '../../common/database/database.service';
import { CreateContentBlockDto, UpdateContentBlockDto } from './dto/content-block.dto';

/**
 * Manages the creator's modular content block menu. The loop selects and orders
 * these blocks per segment; the creator writes once and never hand-writes per
 * segment.
 */
@Injectable()
export class BlocksService {
  constructor(private readonly database: DatabaseService) {}

  async list(userId: string, newsletterId: string): Promise<ContentBlock[]> {
    await this.verifyOwnership(userId, newsletterId);
    return this.database.contentBlock.findMany({
      where: { newsletterId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(
    userId: string,
    newsletterId: string,
    dto: CreateContentBlockDto,
  ): Promise<ContentBlock> {
    await this.verifyOwnership(userId, newsletterId);
    return this.database.contentBlock.create({
      data: {
        newsletterId,
        label: dto.label,
        intent: dto.intent,
        body: dto.body,
        topicId: dto.topicId,
        order: dto.order ?? 0,
      },
    });
  }

  async update(
    userId: string,
    newsletterId: string,
    blockId: string,
    dto: UpdateContentBlockDto,
  ): Promise<ContentBlock> {
    await this.verifyOwnership(userId, newsletterId);
    await this.findBlock(newsletterId, blockId);
    return this.database.contentBlock.update({ where: { id: blockId }, data: dto });
  }

  async remove(userId: string, newsletterId: string, blockId: string): Promise<void> {
    await this.verifyOwnership(userId, newsletterId);
    await this.findBlock(newsletterId, blockId);
    await this.database.contentBlock.delete({ where: { id: blockId } });
  }

  private async findBlock(newsletterId: string, blockId: string): Promise<ContentBlock> {
    const block = await this.database.contentBlock.findFirst({
      where: { id: blockId, newsletterId },
    });
    if (!block) {
      throw new NotFoundException(`Content block ${blockId} not found`);
    }
    return block;
  }

  private async verifyOwnership(userId: string, newsletterId: string): Promise<void> {
    const newsletter = await this.database.newsletter.findUnique({
      where: { id: newsletterId },
      select: { userId: true },
    });
    if (!newsletter) {
      throw new NotFoundException(`Newsletter ${newsletterId} not found`);
    }
    if (newsletter.userId !== userId) {
      throw new ForbiddenException('You do not have access to this newsletter');
    }
  }
}
