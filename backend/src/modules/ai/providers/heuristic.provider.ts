import { Injectable } from '@nestjs/common';
import { AiProvider } from '../ai-provider.interface';
import {
  ArchiveIssueInput,
  NewsletterAnalysis,
  SegmentCondition,
  SegmentProposal,
  SegmentProposalInput,
  VariantAssemblyInput,
} from '../types/ai.types';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'your', 'you', 'are',
  'was', 'have', 'has', 'had', 'but', 'not', 'what', 'when', 'how', 'why',
  'all', 'can', 'will', 'just', 'about', 'into', 'more', 'than', 'them', 'they',
  'their', 'there', 'been', 'being', 'would', 'could', 'should', 'also', 'our',
  'out', 'one', 'two', 'get', 'got', 'its', 'it', 'is', 'in', 'on', 'at', 'to',
  'of', 'a', 'an', 'as', 'by', 'or', 'if', 'we', 'my', 'me', 'so', 'up', 'do',
]);

/**
 * Deterministic, dependency-free analysis used as the development fallback when
 * no OpenAI key is configured. It fills the exact same schema the LLM provider
 * does so downstream features behave identically (with lower quality).
 */
@Injectable()
export class HeuristicProvider implements AiProvider {
  readonly name = 'heuristic' as const;

  async analyzeNewsletter(input: {
    newsletterName: string;
    archive: ArchiveIssueInput[];
  }): Promise<NewsletterAnalysis> {
    const { newsletterName, archive } = input;
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
    const avgWords = Math.round(words.length / Math.max(archive.length, 1));
    const sentences = combinedText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgSentences = Math.round(sentences.length / Math.max(archive.length, 1));
    const avgSentenceLength = sentences.length ? Math.round(words.length / sentences.length) : 0;
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
      avgWords > 1200
        ? 'Deep dives with supporting detail'
        : avgWords > 600
          ? 'Balanced analysis'
          : 'Quick takes and highlights';
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
        expertiseLevel: technicalDepth.includes('Deep')
          ? 'Practitioner to expert'
          : 'Generalist to practitioner',
        motivations: [
          'Stay ahead of trends in their niche',
          'Get actionable ideas without fluff',
          'Understand why something matters, not just what happened',
        ],
      },
      depthFormat: {
        typicalLength:
          avgWords > 1000
            ? 'Long-form (~1000+ words)'
            : avgWords > 500
              ? 'Medium (~500-1000 words)'
              : 'Short (~under 500 words)',
        technicalDepth,
        structure: 'Lead hook -> core argument -> supporting examples -> closing takeaway',
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

  async proposeSegment(input: SegmentProposalInput): Promise<SegmentProposal> {
    const description = input.description.toLowerCase();
    const conditions: SegmentCondition[] = [];
    const excludedSignals: string[] = [];
    if (/cool|cold|declin|churn|risk|at.?risk|laps/.test(description)) {
      conditions.push({ field: 'churnPropensity', operator: 'gte', value: 0.6 });
      conditions.push({ field: 'lifecycleStage', operator: 'eq', value: 'COOLING' });
    }
    if (/new|recent|just signed|fresh/.test(description)) {
      conditions.push({ field: 'lifecycleStage', operator: 'eq', value: 'NEW' });
    }
    if (/engaged|active|loyal|opens everything/.test(description)) {
      conditions.push({ field: 'lifecycleStage', operator: 'eq', value: 'ENGAGED' });
    }
    if (/deep|technical|long.?form|advanced/.test(description)) {
      conditions.push({ field: 'depthPreference', operator: 'eq', value: 'DEEP' });
    }
    if (/skim|quick|short|casual/.test(description)) {
      conditions.push({ field: 'depthPreference', operator: 'eq', value: 'SKIMMER' });
    }
    const matchedTopic = input.topics.find((topic) => description.includes(topic.toLowerCase()));
    if (matchedTopic) {
      conditions.push({
        field: 'topicAffinity',
        topicName: matchedTopic,
        operator: 'gte',
        value: 0.5,
      });
    }
    if (conditions.length === 0) {
      conditions.push({ field: 'lifecycleStage', operator: 'eq', value: 'ENGAGED' });
      excludedSignals.push('No specific signal matched the description; defaulted to engaged readers.');
    }
    return {
      name: input.description.slice(0, 60),
      rule: { match: 'all', conditions },
      rationale: `Heuristic rule derived by keyword-matching the description against available fingerprint fields. It combines ${conditions
        .map((c) => c.field)
        .join(', ')} with AND logic. Replace with an OpenAI key for nuanced rule synthesis.`,
      excludedSignals,
    };
  }

  async assembleVariant(input: VariantAssemblyInput): Promise<string> {
    const orderedBlocks = this.orderBlocks(input);
    const material = orderedBlocks.filter((block) => block.kind !== 'INSTRUCTION');
    const instructions = orderedBlocks.filter((block) => block.kind === 'INSTRUCTION');
    const sections = material
      .map((block, index) => `## ${index + 1}. ${block.label}\n\n${this.renderBlock(block)}`)
      .join('\n\n');
    const note = instructions.length
      ? `\n\n> Author instructions applied: ${instructions.map((b) => b.label).join('; ')}.`
      : '';
    return `# ${input.newsletterName} - ${input.segmentName} edition\n\n> Tuned for: ${input.segmentDescription}. Depth: ${input.depthPreference}. Leading topics: ${input.topAffinities.join(', ') || 'general'}.${note}\n\n${sections}\n\n---\n\n*Assembled by LoopTilt (heuristic). Voice: ${input.voice.tone}, ${input.voice.formality}.*`;
  }

  private renderBlock(block: VariantAssemblyInput['blocks'][number]): string {
    if (block.kind === 'IMAGE' && block.url) {
      return `![${block.label}](${block.url})${block.body ? `\n\n${block.body}` : ''}`;
    }
    if ((block.kind === 'LINK' || block.kind === 'PROMOTION') && block.url) {
      return `${block.body ? `${block.body}\n\n` : ''}[${block.label}](${block.url})`;
    }
    return block.body ?? (block.url ? `[${block.label}](${block.url})` : block.label);
  }

  private orderBlocks(input: VariantAssemblyInput): VariantAssemblyInput['blocks'] {
    const affinity = new Set(input.topAffinities.map((t) => t.toLowerCase()));
    return [...input.blocks].sort((a, b) => {
      const aMatch = a.topicName && affinity.has(a.topicName.toLowerCase()) ? 1 : 0;
      const bMatch = b.topicName && affinity.has(b.topicName.toLowerCase()) ? 1 : 0;
      return bMatch - aMatch;
    });
  }
}
