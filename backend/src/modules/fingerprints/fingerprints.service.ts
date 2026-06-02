import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../common/database/database.service';
import { FingerprintPayload } from './types/fingerprint.types';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'your', 'you', 'are',
  'was', 'have', 'has', 'had', 'but', 'not', 'what', 'when', 'how', 'why',
  'all', 'can', 'will', 'just', 'about', 'into', 'more', 'than', 'them', 'they',
  'their', 'there', 'been', 'being', 'would', 'could', 'should', 'also', 'our',
  'out', 'one', 'two', 'get', 'got', 'its', 'it', 'is', 'in', 'on', 'at', 'to',
  'of', 'a', 'an', 'as', 'by', 'or', 'if', 'we', 'my', 'me', 'so', 'up', 'do',
]);

@Injectable()
export class FingerprintsService {
  constructor(private readonly database: DatabaseService) {}

  async getForNewsletter(userId: string, newsletterId: string) {
    const newsletter = await this.database.newsletter.findUnique({
      where: { id: newsletterId },
      include: { fingerprint: true },
    });
    if (!newsletter) {
      throw new NotFoundException(`Newsletter ${newsletterId} not found`);
    }
    if (newsletter.userId !== userId) {
      throw new ForbiddenException('You do not have access to this newsletter');
    }
    if (!newsletter.fingerprint) {
      throw new NotFoundException('Fingerprint not initialized for this newsletter');
    }
    return newsletter.fingerprint;
  }

  async generate(userId: string, newsletterId: string) {
    const newsletter = await this.database.newsletter.findUnique({
      where: { id: newsletterId },
      include: {
        archive: true,
        fingerprint: true,
      },
    });
    if (!newsletter) {
      throw new NotFoundException(`Newsletter ${newsletterId} not found`);
    }
    if (newsletter.userId !== userId) {
      throw new ForbiddenException('You do not have access to this newsletter');
    }
    if (newsletter.archive.length < 1) {
      throw new BadRequestException(
        'Add at least one archive issue before generating a fingerprint',
      );
    }
    await this.database.newsletterFingerprint.update({
      where: { newsletterId },
      data: { status: 'PROCESSING', errorMessage: null },
    });
    try {
      const payload = this.buildFingerprintFromArchive(newsletter.name, newsletter.archive);
      return this.database.newsletterFingerprint.update({
        where: { newsletterId },
        data: {
          status: 'READY',
          version: { increment: 1 },
          topics: payload.topics as unknown as Prisma.InputJsonValue,
          voice: payload.voice as unknown as Prisma.InputJsonValue,
          audience: payload.audience as unknown as Prisma.InputJsonValue,
          depthFormat: payload.depthFormat as unknown as Prisma.InputJsonValue,
          obsessions: payload.obsessions as unknown as Prisma.InputJsonValue,
          summary: payload.summary,
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

  private buildFingerprintFromArchive(
    newsletterName: string,
    archive: Array<{ title: string; content: string }>,
  ): FingerprintPayload {
    const combinedText = archive.map((issue) => `${issue.title}\n${issue.content}`).join('\n\n');
    const words = combinedText.toLowerCase().match(/[a-z']+/g) ?? [];
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      if (word.length < 4 || STOP_WORDS.has(word)) continue;
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    }
    const rankedTerms = [...wordCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([term, count]) => ({ term, count }));
    const avgWords = Math.round(words.length / archive.length);
    const sentences = combinedText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgSentences = Math.round(sentences.length / archive.length);
    const avgSentenceLength = sentences.length
      ? Math.round(words.length / sentences.length)
      : 0;
    const exclamationCount = (combinedText.match(/!/g) ?? []).length;
    const questionCount = (combinedText.match(/\?/g) ?? []).length;
    const tone =
      exclamationCount > questionCount * 2
        ? 'Energetic and direct'
        : questionCount > exclamationCount
          ? 'Curious and exploratory'
          : 'Measured and analytical';
    const formality =
      avgSentenceLength > 18 ? 'Formal' : avgSentenceLength > 12 ? 'Conversational' : 'Casual';
    const topics = rankedTerms.slice(0, 5).map(({ term, count }, index) => ({
      name: term.charAt(0).toUpperCase() + term.slice(1),
      weight: Math.max(0.2, Number((count / (rankedTerms[0]?.count ?? 1)).toFixed(2))),
      subTopics: rankedTerms.slice(index + 1, index + 3).map((t) => t.term),
    }));
    const signaturePhrases = archive
      .map((issue) => issue.title)
      .slice(0, 3)
      .map((title) => title.split(' ').slice(0, 4).join(' '));
    const technicalDepth =
      avgWords > 1200 ? 'Deep dives with supporting detail' : avgWords > 600 ? 'Balanced analysis' : 'Quick takes and highlights';
    return {
      topics,
      voice: {
        tone,
        formality,
        sentenceRhythm:
          avgSentenceLength > 16
            ? 'Longer sentences with layered clauses'
            : 'Short, punchy sentences with clear beats',
        humor: exclamationCount > 5 ? 'Occasional wit and emphasis' : 'Minimal humor, insight-forward',
        signaturePhrases,
      },
      audience: {
        profile: `Readers of ${newsletterName} who expect ${formality.toLowerCase()} commentary`,
        expertiseLevel: technicalDepth.includes('Deep') ? 'Practitioner to expert' : 'Generalist to practitioner',
        motivations: [
          'Stay ahead of trends in their niche',
          'Get actionable ideas without fluff',
          'Understand why something matters, not just what happened',
        ],
      },
      depthFormat: {
        typicalLength: avgWords > 1000 ? 'Long-form (~1000+ words)' : avgWords > 500 ? 'Medium (~500–1000 words)' : 'Short (~under 500 words)',
        technicalDepth,
        structure: 'Lead hook → core argument → supporting examples → closing takeaway',
        avgWordsPerIssue: avgWords,
        avgSentencesPerIssue: avgSentences,
      },
      obsessions: topics.slice(0, 3).map((topic) => ({
        theme: topic.name,
        frequency: topic.weight > 0.7 ? 'Recurring anchor theme' : 'Periodic thread',
      })),
      summary: `${newsletterName} reads as a ${formality.toLowerCase()}, ${tone.toLowerCase()} newsletter centered on ${topics.map((t) => t.name).join(', ') || 'its core themes'}. Issues average ~${avgWords} words across ${archive.length} archived sends.`,
    };
  }
}
