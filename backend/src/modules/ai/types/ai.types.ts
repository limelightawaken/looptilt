/**
 * Shared AI-layer types. These mirror the structured fingerprint schema the
 * PRD defines (Section 7) plus the inputs/outputs for segmentation and
 * voice-preserving assembly. Both the OpenAI and heuristic providers conform
 * to these shapes so downstream features never depend on which engine ran.
 */

export interface ArchiveIssueInput {
  title: string;
  content: string;
}

export interface FingerprintTopic {
  name: string;
  weight: number;
  subTopics: string[];
}

export interface FingerprintVoice {
  tone: string;
  formality: string;
  sentenceRhythm: string;
  humor: string;
  signaturePhrases: string[];
}

export interface FingerprintAudience {
  profile: string;
  expertiseLevel: string;
  motivations: string[];
}

export interface FingerprintDepthFormat {
  typicalLength: string;
  technicalDepth: string;
  structure: string;
  avgWordsPerIssue: number;
  avgSentencesPerIssue: number;
}

export interface FingerprintObsession {
  theme: string;
  frequency: string;
}

export interface NewsletterAnalysis {
  topics: FingerprintTopic[];
  voice: FingerprintVoice;
  audience: FingerprintAudience;
  depthFormat: FingerprintDepthFormat;
  obsessions: FingerprintObsession[];
  summary: string;
}

export type SegmentConditionField =
  | 'topicAffinity'
  | 'lifecycleStage'
  | 'churnPropensity'
  | 'depthPreference'
  | 'acquisitionChannel';

export type SegmentConditionOperator = 'gte' | 'lte' | 'eq' | 'neq';

export interface SegmentCondition {
  field: SegmentConditionField;
  topicName?: string;
  operator: SegmentConditionOperator;
  value: string | number;
}

export interface SegmentRule {
  match: 'all' | 'any';
  conditions: SegmentCondition[];
}

export interface SegmentProposal {
  name: string;
  rule: SegmentRule;
  rationale: string;
  excludedSignals: string[];
}

export interface SegmentProposalInput {
  description: string;
  topics: string[];
  acquisitionChannels: string[];
}

export type AssemblyBlockKind = 'CONTENT' | 'LINK' | 'IMAGE' | 'PROMOTION' | 'INSTRUCTION';

export interface AssemblyBlock {
  kind: AssemblyBlockKind;
  label: string;
  intent?: string;
  body?: string;
  url?: string;
  topicName?: string;
}

export interface VariantAssemblyInput {
  newsletterName: string;
  voice: FingerprintVoice;
  blocks: AssemblyBlock[];
  segmentName: string;
  segmentDescription: string;
  topAffinities: string[];
  depthPreference: string;
}
