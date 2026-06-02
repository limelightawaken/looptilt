import {
  ArchiveIssueInput,
  NewsletterAnalysis,
  SegmentProposal,
  SegmentProposalInput,
  VariantAssemblyInput,
} from './types/ai.types';

export type AiProviderName = 'openai' | 'heuristic';

/**
 * Contract every AI provider implements. The newsletter fingerprint,
 * segment rule building, and per-segment voice assembly are all expressed here
 * so the rest of the app is provider-agnostic.
 */
export interface AiProvider {
  readonly name: AiProviderName;
  analyzeNewsletter(input: {
    newsletterName: string;
    archive: ArchiveIssueInput[];
  }): Promise<NewsletterAnalysis>;
  proposeSegment(input: SegmentProposalInput): Promise<SegmentProposal>;
  assembleVariant(input: VariantAssemblyInput): Promise<string>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
