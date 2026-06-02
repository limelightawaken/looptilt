import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../common/database/database.service';
import { AiService } from '../ai/ai.service';
import { NewsletterAnalysis } from '../ai/types/ai.types';

/**
 * Owns newsletter fingerprint generation. Delegates the actual analysis to the
 * AI layer (OpenAI or heuristic) and persists topics as stable rows so that
 * downstream click-to-topic mapping has durable ids to reference.
 */
@Injectable()
export class FingerprintsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly aiService: AiService,
  ) {}

  async getForNewsletter(userId: string, newsletterId: string) {
    const newsletter = await this.findOwnedNewsletter(userId, newsletterId);
    const fingerprint = await this.database.newsletterFingerprint.findUnique({
      where: { newsletterId: newsletter.id },
    });
    if (!fingerprint) {
      throw new NotFoundException('Fingerprint not initialized for this newsletter');
    }
    return fingerprint;
  }

  async generate(userId: string, newsletterId: string) {
    const newsletter = await this.findOwnedNewsletter(userId, newsletterId);
    const archive = await this.database.archiveIssue.findMany({
      where: { newsletterId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    if (archive.length < 1) {
      throw new BadRequestException(
        'Add at least one archive issue before generating a fingerprint',
      );
    }
    await this.database.newsletterFingerprint.update({
      where: { newsletterId },
      data: { status: 'PROCESSING', errorMessage: null },
    });
    try {
      const analysis = await this.aiService.analyzeNewsletter({
        newsletterName: newsletter.name,
        archive: archive.map((issue) => ({ title: issue.title, content: issue.content })),
      });
      await this.persistTopics(newsletterId, analysis);
      return await this.database.newsletterFingerprint.update({
        where: { newsletterId },
        data: {
          status: 'READY',
          version: { increment: 1 },
          generatedBy: this.aiService.activeProvider,
          topics: analysis.topics as unknown as Prisma.InputJsonValue,
          voice: analysis.voice as unknown as Prisma.InputJsonValue,
          audience: analysis.audience as unknown as Prisma.InputJsonValue,
          depthFormat: analysis.depthFormat as unknown as Prisma.InputJsonValue,
          obsessions: analysis.obsessions as unknown as Prisma.InputJsonValue,
          summary: analysis.summary,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fingerprint generation failed';
      await this.database.newsletterFingerprint.update({
        where: { newsletterId },
        data: { status: 'FAILED', errorMessage: message },
      });
      throw error;
    }
  }

  private async persistTopics(newsletterId: string, analysis: NewsletterAnalysis): Promise<void> {
    await this.database.$transaction(
      analysis.topics.map((topic) => {
        const slug = this.toSlug(topic.name);
        return this.database.newsletterTopic.upsert({
          where: { newsletterId_slug: { newsletterId, slug } },
          create: {
            newsletterId,
            name: topic.name,
            slug,
            weight: topic.weight,
            subTopics: topic.subTopics,
          },
          update: { name: topic.name, weight: topic.weight, subTopics: topic.subTopics },
        });
      }),
    );
  }

  private toSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'topic';
  }

  private async findOwnedNewsletter(userId: string, newsletterId: string) {
    const newsletter = await this.database.newsletter.findUnique({
      where: { id: newsletterId },
      select: { id: true, name: true, userId: true },
    });
    if (!newsletter) {
      throw new NotFoundException(`Newsletter ${newsletterId} not found`);
    }
    if (newsletter.userId !== userId) {
      throw new ForbiddenException('You do not have access to this newsletter');
    }
    return newsletter;
  }
}
