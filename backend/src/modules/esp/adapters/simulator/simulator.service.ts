import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NewsletterTopic, Prisma, SignalType, Subscriber } from '@prisma/client';
import { DatabaseService } from '../../../../common/database/database.service';
import { NewsletterAnalysis } from '../../../ai/types/ai.types';
import { RecomputeService } from '../../../loop/recompute.service';

const CHANNELS = ['referral', 'recommendation', 'social', 'organic', 'paid'];
const FIRST_NAMES = ['Alex', 'Sam', 'Jordan', 'Riley', 'Casey', 'Taylor', 'Morgan', 'Jamie'];
type Trajectory = 'rising' | 'stable' | 'declining';
const TRAJECTORIES: Trajectory[] = ['rising', 'stable', 'declining'];
const MS_PER_DAY = 86_400_000;

const DEMO_ARCHIVE = {
  title: 'Demo issue: growth, product, and strategy',
  content: `This demo archive issue gives the fingerprint layer realistic sample copy about growth,
product launches, team culture, and long-term strategy. Readers who care about growth want
actionable frameworks, not hype. Product teams need clear positioning and crisp launches.
Strategy discussions should connect daily decisions to outcomes. Culture threads keep the
newsletter human and memorable. Use this seeded content to explore segments, signals, and
per-segment sends without connecting a live Kit account.`,
};

const DEMO_TOPICS: { name: string; slug: string; weight: number; subTopics: string[] }[] = [
  { name: 'Growth', slug: 'growth', weight: 0.85, subTopics: ['acquisition', 'retention'] },
  { name: 'Product', slug: 'product', weight: 0.7, subTopics: ['launches', 'positioning'] },
  { name: 'Strategy', slug: 'strategy', weight: 0.6, subTopics: ['roadmaps', 'priorities'] },
  { name: 'Culture', slug: 'culture', weight: 0.45, subTopics: ['teams', 'values'] },
];

export interface SeedResult {
  archiveIssues: number;
  topics: number;
  fingerprintReady: boolean;
  subscribers: number;
  events: number;
  issues: number;
  readersUpdated: number;
  segments: number;
  memberships: number;
}

/**
 * Local signal simulator (development only). One seed prepares archive, fingerprint
 * topics, subscribers, signals, and runs the re-segmentation loop for SIMULATOR mode.
 */
@Injectable()
export class SimulatorService {
  constructor(
    private readonly database: DatabaseService,
    private readonly recomputeService: RecomputeService,
  ) {}

  async seed(
    userId: string,
    newsletterId: string,
    subscriberCount: number,
    issues: number,
  ): Promise<SeedResult> {
    const newsletter = await this.verifySimulatorNewsletter(userId, newsletterId);
    const archiveIssues = await this.ensureDemoArchive(newsletterId);
    const topics = await this.ensureDemoTopics(newsletterId);
    await this.ensureDemoFingerprint(newsletterId, newsletter.name);
    await this.resetSimulatorData(newsletterId);
    const subscribers = await this.createSimulatorSubscribers(newsletterId, subscriberCount);
    const signalBatch = this.buildSignalEvents(newsletterId, subscribers, topics, issues);
    await this.database.signalEvent.createMany({ data: signalBatch.events });
    const loop = await this.recomputeService.recompute(newsletterId);
    return {
      archiveIssues,
      topics: topics.length,
      fingerprintReady: true,
      subscribers: subscribers.length,
      events: signalBatch.events.length,
      issues: signalBatch.issueCount,
      readersUpdated: loop.readersUpdated,
      segments: loop.segments,
      memberships: loop.memberships,
    };
  }

  private async ensureDemoArchive(newsletterId: string): Promise<number> {
    const count = await this.database.archiveIssue.count({ where: { newsletterId } });
    if (count > 0) {
      return count;
    }
    await this.database.archiveIssue.create({
      data: {
        newsletterId,
        title: DEMO_ARCHIVE.title,
        content: DEMO_ARCHIVE.content,
        sortOrder: 0,
      },
    });
    return 1;
  }

  private async ensureDemoTopics(newsletterId: string): Promise<NewsletterTopic[]> {
    await this.database.$transaction(
      DEMO_TOPICS.map((topic) =>
        this.database.newsletterTopic.upsert({
          where: { newsletterId_slug: { newsletterId, slug: topic.slug } },
          create: {
            newsletterId,
            name: topic.name,
            slug: topic.slug,
            weight: topic.weight,
            subTopics: topic.subTopics,
          },
          update: {
            name: topic.name,
            weight: topic.weight,
            subTopics: topic.subTopics,
          },
        }),
      ),
    );
    return this.database.newsletterTopic.findMany({
      where: { newsletterId },
      orderBy: { weight: 'desc' },
    });
  }

  private async ensureDemoFingerprint(newsletterId: string, newsletterName: string): Promise<void> {
    const analysis = this.buildDemoFingerprintAnalysis(newsletterName);
    await this.database.newsletterFingerprint.update({
      where: { newsletterId },
      data: {
        status: 'READY',
        errorMessage: null,
        generatedBy: 'simulator',
        version: { increment: 1 },
        topics: analysis.topics as unknown as Prisma.InputJsonValue,
        voice: analysis.voice as unknown as Prisma.InputJsonValue,
        audience: analysis.audience as unknown as Prisma.InputJsonValue,
        depthFormat: analysis.depthFormat as unknown as Prisma.InputJsonValue,
        obsessions: analysis.obsessions as unknown as Prisma.InputJsonValue,
        summary: analysis.summary,
      },
    });
  }

  private buildDemoFingerprintAnalysis(newsletterName: string): NewsletterAnalysis {
    const topics = DEMO_TOPICS.map((topic) => ({
      name: topic.name,
      weight: topic.weight,
      subTopics: topic.subTopics,
    }));
    return {
      topics,
      voice: {
        tone: 'Measured and analytical',
        formality: 'Conversational',
        sentenceRhythm: 'Short, punchy sentences with clear beats',
        humor: 'Minimal humor, insight-forward',
        signaturePhrases: ['What great growth looks like', 'The product launch playbook'],
      },
      audience: {
        profile: `Readers of ${newsletterName} who expect practical commentary`,
        expertiseLevel: 'Generalist to practitioner',
        motivations: [
          'Stay ahead of trends in their niche',
          'Get actionable ideas without fluff',
          'Understand why something matters, not just what happened',
        ],
      },
      depthFormat: {
        typicalLength: 'Medium (~500-1000 words)',
        technicalDepth: 'Balanced analysis',
        structure: 'Lead hook -> core argument -> supporting examples -> closing takeaway',
        avgWordsPerIssue: 720,
        avgSentencesPerIssue: 42,
      },
      obsessions: topics.slice(0, 3).map((topic) => ({
        theme: topic.name,
        frequency: topic.weight > 0.7 ? 'Recurring anchor theme' : 'Periodic thread',
      })),
      summary: `${newsletterName} demo fingerprint: a conversational newsletter centered on ${topics.map((t) => t.name).join(', ')}. Seeded for local testing in SIMULATOR mode.`,
    };
  }

  private async resetSimulatorData(newsletterId: string): Promise<void> {
    await this.database.subscriber.deleteMany({
      where: { newsletterId, source: 'SIMULATOR' },
    });
  }

  private async createSimulatorSubscribers(
    newsletterId: string,
    subscriberCount: number,
  ): Promise<Subscriber[]> {
    const count = Math.min(Math.max(subscriberCount, 1), 500);
    const rows: Prisma.SubscriberCreateManyInput[] = [];
    for (let i = 0; i < count; i += 1) {
      rows.push({
        newsletterId,
        source: 'SIMULATOR',
        email: `reader${i}@demo.looptilt.dev`,
        firstName: FIRST_NAMES[i % FIRST_NAMES.length],
        channel: CHANNELS[i % CHANNELS.length],
        signupContext: 'demo-seed',
      });
    }
    await this.database.subscriber.createMany({ data: rows });
    return this.database.subscriber.findMany({
      where: { newsletterId, source: 'SIMULATOR' },
      orderBy: { createdAt: 'asc' },
    });
  }

  private buildSignalEvents(
    newsletterId: string,
    subscribers: Subscriber[],
    topics: NewsletterTopic[],
    issues: number,
  ): { events: Prisma.SignalEventCreateManyInput[]; issueCount: number } {
    const issueCount = Math.min(Math.max(issues, 1), 30);
    const events: Prisma.SignalEventCreateManyInput[] = [];
    subscribers.forEach((subscriber, index) => {
      const trajectory = TRAJECTORIES[index % TRAJECTORIES.length];
      const favouriteTopic = topics[index % topics.length];
      this.appendSubscriberEvents({
        subscriber,
        topics,
        favouriteTopic,
        trajectory,
        issueCount,
        newsletterId,
        events,
      });
    });
    return { events, issueCount };
  }

  private appendSubscriberEvents(params: {
    subscriber: Subscriber;
    topics: NewsletterTopic[];
    favouriteTopic: NewsletterTopic;
    trajectory: Trajectory;
    issueCount: number;
    newsletterId: string;
    events: Prisma.SignalEventCreateManyInput[];
  }): void {
    const { subscriber, topics, favouriteTopic, trajectory, issueCount, newsletterId, events } =
      params;
    for (let issue = 0; issue < issueCount; issue += 1) {
      const occurredAt = new Date(Date.now() - (issueCount - issue) * 7 * MS_PER_DAY);
      const openProbability = this.openProbability(trajectory, issue, issueCount);
      if (Math.random() > openProbability) {
        continue;
      }
      events.push({
        newsletterId,
        subscriberId: subscriber.id,
        type: SignalType.OPEN,
        source: 'SIMULATOR',
        occurredAt,
      });
      if (Math.random() < 0.55) {
        const clickTopic = Math.random() < 0.7 ? favouriteTopic : this.pick(topics);
        events.push({
          newsletterId,
          subscriberId: subscriber.id,
          type: SignalType.LINK_CLICK,
          source: 'SIMULATOR',
          topicId: clickTopic.id,
          linkUrl: `https://demo.looptilt.dev/i/${issue}?lt=${clickTopic.slug}`,
          position: Math.random() < 0.5 ? 'upper' : 'lower',
          occurredAt,
        });
      }
      if (Math.random() < 0.12) {
        const positive = trajectory !== 'declining';
        events.push({
          newsletterId,
          subscriberId: subscriber.id,
          type: positive ? SignalType.MORE_LIKE_THIS : SignalType.LESS_LIKE_THIS,
          source: 'SIMULATOR',
          topicId: favouriteTopic.id,
          value: positive ? 1 : -1,
          occurredAt,
        });
      }
    }
  }

  private openProbability(trajectory: Trajectory, issue: number, total: number): number {
    const progress = total > 1 ? issue / (total - 1) : 1;
    if (trajectory === 'rising') {
      return 0.3 + 0.6 * progress;
    }
    if (trajectory === 'declining') {
      return 0.85 - 0.7 * progress;
    }
    return 0.6;
  }

  private pick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  private async verifySimulatorNewsletter(userId: string, newsletterId: string) {
    const newsletter = await this.database.newsletter.findUnique({
      where: { id: newsletterId },
      select: { userId: true, name: true, esp: true },
    });
    if (!newsletter) {
      throw new NotFoundException(`Newsletter ${newsletterId} not found`);
    }
    if (newsletter.userId !== userId) {
      throw new ForbiddenException('You do not have access to this newsletter');
    }
    if (!newsletter.esp || newsletter.esp.dataSource !== 'SIMULATOR') {
      throw new BadRequestException(
        'The newsletter must be connected in Demo data (SIMULATOR) mode to use the simulator',
      );
    }
    return newsletter;
  }
}
