/**
 * Per-subscriber fingerprint shapes. Topic affinities are scored against the
 * newsletter's own topics; the churn signal is driven by the slope of
 * engagement (the PRD's derivative rule), not its current level.
 */
export interface TopicAffinity {
  topicId: string;
  name: string;
  slug: string;
  score: number;
  trend: number;
  clicks: number;
}

export interface ComputedReaderFingerprint {
  topicAffinities: TopicAffinity[];
  depthPreference: 'UNKNOWN' | 'SKIMMER' | 'DEEP';
  lifecycleStage: 'NEW' | 'WARMING' | 'ENGAGED' | 'COOLING' | 'DORMANT' | 'REACTIVATED';
  churnPropensity: number;
  openRate: number;
  signalCount: number;
}
