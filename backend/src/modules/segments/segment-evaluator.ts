import { ReaderFingerprint, Subscriber } from '@prisma/client';
import { SegmentCondition, SegmentRule } from '../ai/types/ai.types';
import { TopicAffinity } from '../reader-fingerprints/types/reader-fingerprint.types';

/**
 * Pure evaluation of a segment rule against a reader fingerprint. Used both to
 * assign memberships and to estimate match counts when previewing AI segments.
 */
export function evaluateSegmentRule(
  rule: SegmentRule,
  fingerprint: ReaderFingerprint | null,
  subscriber: Subscriber,
): boolean {
  if (!fingerprint) {
    return false;
  }
  const results = rule.conditions.map((condition) =>
    evaluateCondition(condition, fingerprint, subscriber),
  );
  return rule.match === 'any' ? results.some(Boolean) : results.every(Boolean);
}

function evaluateCondition(
  condition: SegmentCondition,
  fingerprint: ReaderFingerprint,
  subscriber: Subscriber,
): boolean {
  const actual = resolveFieldValue(condition, fingerprint, subscriber);
  if (actual === null || actual === undefined) {
    return false;
  }
  return compare(actual, condition.operator, condition.value);
}

function resolveFieldValue(
  condition: SegmentCondition,
  fingerprint: ReaderFingerprint,
  subscriber: Subscriber,
): string | number | null {
  switch (condition.field) {
    case 'topicAffinity': {
      const affinities = (fingerprint.topicAffinities as unknown as TopicAffinity[]) ?? [];
      const match = affinities.find(
        (affinity) =>
          affinity.slug === condition.topicName ||
          affinity.name.toLowerCase() === (condition.topicName ?? '').toLowerCase(),
      );
      return match ? match.score : 0;
    }
    case 'lifecycleStage':
      return fingerprint.lifecycleStage;
    case 'churnPropensity':
      return fingerprint.churnPropensity;
    case 'depthPreference':
      return fingerprint.depthPreference;
    case 'acquisitionChannel':
      return subscriber.channel ?? null;
    default:
      return null;
  }
}

function compare(
  actual: string | number,
  operator: SegmentCondition['operator'],
  expected: string | number,
): boolean {
  if (operator === 'eq') {
    return String(actual).toUpperCase() === String(expected).toUpperCase();
  }
  if (operator === 'neq') {
    return String(actual).toUpperCase() !== String(expected).toUpperCase();
  }
  const actualNum = Number(actual);
  const expectedNum = Number(expected);
  if (Number.isNaN(actualNum) || Number.isNaN(expectedNum)) {
    return false;
  }
  return operator === 'gte' ? actualNum >= expectedNum : actualNum <= expectedNum;
}
