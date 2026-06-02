import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, AiProvider, AiProviderName } from './ai-provider.interface';
import {
  ArchiveIssueInput,
  NewsletterAnalysis,
  SegmentProposal,
  SegmentProposalInput,
  VariantAssemblyInput,
} from './types/ai.types';

/**
 * Facade over the active AI provider. The concrete provider (OpenAI or
 * heuristic) is resolved once at module construction; this service exposes the
 * provider name so the readiness endpoint can report whether real AI is active.
 */
@Injectable()
export class AiService {
  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  get activeProvider(): AiProviderName {
    return this.provider.name;
  }

  analyzeNewsletter(input: {
    newsletterName: string;
    archive: ArchiveIssueInput[];
  }): Promise<NewsletterAnalysis> {
    return this.provider.analyzeNewsletter(input);
  }

  proposeSegment(input: SegmentProposalInput): Promise<SegmentProposal> {
    return this.provider.proposeSegment(input);
  }

  assembleVariant(input: VariantAssemblyInput): Promise<string> {
    return this.provider.assembleVariant(input);
  }
}
