export type EspProvider = "NONE" | "KIT" | "BEEHIIV" | "KLAVIYO" | "MAILCHIMP";
export type DataSource = "LIVE_KIT" | "SIMULATOR";
export type FingerprintStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";
export type DraftStatus = "DRAFT" | "REVIEW" | "APPROVED";
export type LifecycleStage =
  | "NEW"
  | "WARMING"
  | "ENGAGED"
  | "COOLING"
  | "DORMANT"
  | "REACTIVATED";
export type DepthPreference = "UNKNOWN" | "SKIMMER" | "DEEP";
export type SegmentKind =
  | "DEFAULT_LIFECYCLE"
  | "DEFAULT_DEPTH"
  | "DEFAULT_AFFINITY"
  | "CUSTOM";
export type SendStatus =
  | "DRAFT"
  | "GENERATING"
  | "READY"
  | "PUBLISHING"
  | "PUBLISHED"
  | "FAILED";
export type VariantStatus = "PENDING" | "GENERATED" | "PUBLISHED" | "FAILED";

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

export interface NewsletterFingerprint {
  id: string;
  newsletterId: string;
  status: FingerprintStatus;
  version: number;
  generatedBy: string | null;
  topics: FingerprintTopic[] | null;
  voice: FingerprintVoice | null;
  audience: FingerprintAudience | null;
  depthFormat: FingerprintDepthFormat | null;
  obsessions: FingerprintObsession[] | null;
  summary: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArchiveIssue {
  id: string;
  newsletterId: string;
  title: string;
  content: string;
  publishedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GhostwriterDraft {
  id: string;
  newsletterId: string;
  fingerprintId: string | null;
  title: string;
  outline: string[] | null;
  content: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
}

export type ContentBlockKind = "CONTENT" | "LINK" | "IMAGE" | "PROMOTION" | "INSTRUCTION";

export interface ContentBlock {
  id: string;
  sendId: string;
  kind: ContentBlockKind;
  label: string;
  intent: string | null;
  body: string | null;
  url: string | null;
  topicId: string | null;
  order: number;
}

export interface TopicAffinity {
  topicId: string;
  name: string;
  slug: string;
  score: number;
  trend: number;
  clicks: number;
}

export interface ReaderFingerprint {
  id: string;
  subscriberId: string;
  topicAffinities: TopicAffinity[];
  depthPreference: DepthPreference;
  lifecycleStage: LifecycleStage;
  churnPropensity: number;
  openRate: number | null;
  signalCount: number;
}

export interface Reader {
  id: string;
  email: string;
  firstName: string | null;
  channel: string | null;
  source: DataSource;
  fingerprint: ReaderFingerprint | null;
}

export interface Insights {
  totalSubscribers: number;
  withFingerprint: number;
  averageChurn: number;
  atRiskCount: number;
  lifecycleCounts: Record<string, number>;
  topicEngagement: Array<{ topic: string; clicks: number }>;
}

export interface SegmentCondition {
  field: string;
  topicName?: string;
  operator: "gte" | "lte" | "eq" | "neq";
  value: string | number;
}

export interface SegmentRule {
  match: "all" | "any";
  conditions: SegmentCondition[];
}

export interface Segment {
  id: string;
  newsletterId: string;
  name: string;
  kind: SegmentKind;
  description: string | null;
  rationale: string | null;
  definition: SegmentRule | null;
  kitTagId: string | null;
  isActive: boolean;
  _count?: { memberships: number };
}

export interface SegmentPreview {
  name: string;
  rule: SegmentRule;
  rationale: string;
  excludedSignals: string[];
  estimatedCount: number;
}

export interface SegmentVariant {
  id: string;
  sendId: string;
  segmentId: string;
  content: string;
  kitBroadcastId: string | null;
  status: VariantStatus;
  segment: Segment;
}

export interface Send {
  id: string;
  newsletterId: string;
  title: string;
  status: SendStatus;
  createdAt: string;
  variants: SegmentVariant[];
  blocks: ContentBlock[];
}

export interface EspStatus {
  connected: boolean;
  dataSource: DataSource | null;
  provider: string | null;
  accountId: string | null;
}

export interface RecomputeResult {
  readersUpdated: number;
  segments: number;
  memberships: number;
}

export interface NewsletterSummary {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  espProvider: EspProvider;
  createdAt: string;
  updatedAt: string;
  _count: { archive: number; drafts: number };
  fingerprint: {
    id: string;
    status: FingerprintStatus;
    version: number;
    summary: string | null;
    updatedAt: string;
  } | null;
}

export interface NewsletterDetail extends Omit<NewsletterSummary, "fingerprint"> {
  archive: ArchiveIssue[];
  fingerprint: NewsletterFingerprint | null;
  drafts: GhostwriterDraft[];
  esp: { id: string; provider: EspProvider; dataSource: DataSource; isActive: boolean } | null;
}
