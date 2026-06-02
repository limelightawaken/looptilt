import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Newsletter } from '@prisma/client';
import { DatabaseService } from '../../common/database/database.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import { AddArchiveIssueDto } from './dto/add-archive-issue.dto';

@Injectable()
export class NewslettersService {
  constructor(private readonly database: DatabaseService) {}

  async create(userId: string, dto: CreateNewsletterDto): Promise<Newsletter> {
    return this.database.newsletter.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        espProvider: dto.espProvider ?? 'NONE',
        fingerprint: {
          create: {
            status: 'PENDING',
          },
        },
      },
    });
  }

  async findAllForUser(userId: string): Promise<Newsletter[]> {
    return this.database.newsletter.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            archive: true,
            drafts: true,
          },
        },
        fingerprint: {
          select: {
            id: true,
            status: true,
            version: true,
            summary: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async findOneForUser(userId: string, id: string) {
    const newsletter = await this.database.newsletter.findUnique({
      where: { id },
      include: {
        archive: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        },
        fingerprint: true,
        drafts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        esp: true,
        _count: {
          select: {
            archive: true,
            drafts: true,
          },
        },
      },
    });
    if (!newsletter) {
      throw new NotFoundException(`Newsletter ${id} not found`);
    }
    if (newsletter.userId !== userId) {
      throw new ForbiddenException('You do not have access to this newsletter');
    }
    return newsletter;
  }

  async update(userId: string, id: string, dto: UpdateNewsletterDto): Promise<Newsletter> {
    await this.findOneForUser(userId, id);
    return this.database.newsletter.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOneForUser(userId, id);
    await this.database.newsletter.delete({ where: { id } });
  }

  async addArchiveIssue(userId: string, newsletterId: string, dto: AddArchiveIssueDto) {
    await this.findOneForUser(userId, newsletterId);
    return this.database.archiveIssue.create({
      data: {
        newsletterId,
        title: dto.title,
        content: dto.content,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async removeArchiveIssue(userId: string, newsletterId: string, issueId: string): Promise<void> {
    await this.findOneForUser(userId, newsletterId);
    const issue = await this.database.archiveIssue.findFirst({
      where: { id: issueId, newsletterId },
    });
    if (!issue) {
      throw new NotFoundException(`Archive issue ${issueId} not found`);
    }
    await this.database.archiveIssue.delete({ where: { id: issueId } });
  }
}
