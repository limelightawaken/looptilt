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

export interface FingerprintPayload {
  topics: FingerprintTopic[];
  voice: FingerprintVoice;
  audience: FingerprintAudience;
  depthFormat: FingerprintDepthFormat;
  obsessions: FingerprintObsession[];
  summary: string;
}
