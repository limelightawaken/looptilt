import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';
import { AiProvider } from '../ai-provider.interface';
import {
  ArchiveIssueInput,
  NewsletterAnalysis,
  SegmentProposal,
  SegmentProposalInput,
  VariantAssemblyInput,
} from '../types/ai.types';
import { HeuristicProvider } from './heuristic.provider';

const analysisSchema = z.object({
  topics: z
    .array(
      z.object({
        name: z.string(),
        weight: z.number(),
        subTopics: z.array(z.string()),
      }),
    )
    .min(1),
  voice: z.object({
    tone: z.string(),
    formality: z.string(),
    sentenceRhythm: z.string(),
    humor: z.string(),
    signaturePhrases: z.array(z.string()),
  }),
  audience: z.object({
    profile: z.string(),
    expertiseLevel: z.string(),
    motivations: z.array(z.string()),
  }),
  depthFormat: z.object({
    typicalLength: z.string(),
    technicalDepth: z.string(),
    structure: z.string(),
    avgWordsPerIssue: z.number(),
    avgSentencesPerIssue: z.number(),
  }),
  obsessions: z.array(z.object({ theme: z.string(), frequency: z.string() })),
  summary: z.string(),
});

const segmentSchema = z.object({
  name: z.string(),
  rule: z.object({
    match: z.enum(['all', 'any']),
    conditions: z
      .array(
        z.object({
          field: z.enum([
            'topicAffinity',
            'lifecycleStage',
            'churnPropensity',
            'depthPreference',
            'acquisitionChannel',
          ]),
          topicName: z.string().optional(),
          operator: z.enum(['gte', 'lte', 'eq', 'neq']),
          value: z.union([z.string(), z.number()]),
        }),
      )
      .min(1),
  }),
  rationale: z.string(),
  excludedSignals: z.array(z.string()),
});

/**
 * OpenAI-backed provider. Produces structured JSON validated with zod; on any
 * malformed response it falls back to the heuristic result for that single call
 * so a transient model error never breaks the feature.
 */
@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly name = 'openai' as const;
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(
    private readonly client: OpenAI,
    private readonly model: string,
    private readonly heuristic: HeuristicProvider,
  ) {}

  async analyzeNewsletter(input: {
    newsletterName: string;
    archive: ArchiveIssueInput[];
  }): Promise<NewsletterAnalysis> {
    const archiveText = input.archive
      .map((issue, index) => `ISSUE ${index + 1}: ${issue.title}\n${issue.content}`)
      .join('\n\n---\n\n')
      .slice(0, 24000);
    const prompt = `You are a sharp newsletter editor. Read this archive for "${input.newsletterName}" and produce a structured fingerprint.\n\nReturn JSON matching this exact shape: { topics: [{name, weight (0-1), subTopics: string[]}], voice: {tone, formality, sentenceRhythm, humor, signaturePhrases: string[]}, audience: {profile, expertiseLevel, motivations: string[]}, depthFormat: {typicalLength, technicalDepth, structure, avgWordsPerIssue (number), avgSentencesPerIssue (number)}, obsessions: [{theme, frequency}], summary }.\n\nArchive:\n${archiveText}`;
    const parsed = await this.completeJson(prompt, analysisSchema);
    if (!parsed) {
      return this.heuristic.analyzeNewsletter(input);
    }
    return parsed;
  }

  async proposeSegment(input: SegmentProposalInput): Promise<SegmentProposal> {
    const prompt = `You build newsletter reader segments from plain-language descriptions.\n\nAvailable fingerprint fields: topicAffinity (per topic, 0-1, use topicName), lifecycleStage (NEW|WARMING|ENGAGED|COOLING|DORMANT|REACTIVATED), churnPropensity (0-1), depthPreference (SKIMMER|DEEP), acquisitionChannel.\nAvailable topics: ${input.topics.join(', ') || 'none yet'}.\nAvailable channels: ${input.acquisitionChannels.join(', ') || 'unknown'}.\n\nTranslate this description into a concrete rule. Description: "${input.description}".\n\nReturn JSON: { name, rule: { match: "all"|"any", conditions: [{field, topicName?, operator: "gte"|"lte"|"eq"|"neq", value}] }, rationale (explain why you chose these signals and thresholds), excludedSignals (signals you deliberately left out and why) }.`;
    const parsed = await this.completeJson(prompt, segmentSchema);
    if (!parsed) {
      return this.heuristic.proposeSegment(input);
    }
    return parsed;
  }

  async assembleVariant(input: VariantAssemblyInput): Promise<string> {
    const instructions = input.blocks
      .filter((b) => b.kind === 'INSTRUCTION')
      .map((b) => `- ${b.label}${b.body ? `: ${b.body}` : ''}`)
      .join('\n');
    const material = input.blocks
      .filter((b) => b.kind !== 'INSTRUCTION')
      .map((b) => {
        const meta = [b.kind.toLowerCase(), b.topicName ? `topic: ${b.topicName}` : null, b.intent ? `intent: ${b.intent}` : null]
          .filter(Boolean)
          .join(' | ');
        const parts = [`- [${b.label}${meta ? ` | ${meta}` : ''}]`];
        if (b.body) parts.push(b.body);
        if (b.url) parts.push(`URL: ${b.url}`);
        return parts.join('\n');
      })
      .join('\n\n');
    const instructionSection = instructions
      ? `\n\nFollow these author instructions (apply them, do not print them verbatim):\n${instructions}`
      : '';
    const prompt = `You are the ghostwriter for "${input.newsletterName}". Write the next issue for the segment "${input.segmentName}" (${input.segmentDescription}). This segment leans toward topics: ${input.topAffinities.join(', ') || 'general'} and prefers ${input.depthPreference} depth.\n\nPreserve the newsletter's voice exactly: tone=${input.voice.tone}, formality=${input.voice.formality}, rhythm=${input.voice.sentenceRhythm}, humor=${input.voice.humor}. Use signature phrasing like: ${input.voice.signaturePhrases.join('; ')}.\n\nSelect, order, and lightly adapt the material below for this segment. Lead with what matches their affinities; cut or shorten what does not. Include any links, images, and promotions using their exact URLs (images as markdown image embeds). Do not invent facts or URLs beyond what is provided. Return the issue as markdown.${instructionSection}\n\nMaterial:\n${material}`;
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        return this.heuristic.assembleVariant(input);
      }
      return content;
    } catch (error) {
      this.logger.error('OpenAI assembleVariant failed, using heuristic', error);
      return this.heuristic.assembleVariant(input);
    }
  }

  private async completeJson<T>(prompt: string, schema: z.ZodType<T>): Promise<T | null> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You return only valid JSON with no markdown fencing.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      });
      const raw = response.choices[0]?.message?.content;
      if (!raw) {
        return null;
      }
      const parsed = schema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        this.logger.warn('OpenAI response failed schema validation');
        return null;
      }
      return parsed.data;
    } catch (error) {
      this.logger.error('OpenAI JSON completion failed', error);
      return null;
    }
  }
}
