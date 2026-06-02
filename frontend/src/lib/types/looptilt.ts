export type EspProvider = "NONE" | "KIT" | "BEEHIIV" | "KLAVIYO" | "MAILCHIMP";
export type FingerprintStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";
export type DraftStatus = "DRAFT" | "REVIEW" | "APPROVED";

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

export interface NewsletterSummary {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  espProvider: EspProvider;
  createdAt: string;
  updatedAt: string;
  _count: {
    archive: number;
    drafts: number;
  };
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
  esp: { id: string; provider: EspProvider; isActive: boolean } | null;
}
