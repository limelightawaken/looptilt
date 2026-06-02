import { Injectable } from '@nestjs/common';
import { ContentBlock, NewsletterFingerprint, Segment } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { AssemblyBlock, FingerprintVoice } from '../ai/types/ai.types';

export interface SegmentProfile {
  topAffinities: string[];
  depthPreference: string;
}

/**
 * Produces a voice-preserving per-segment variant by handing the fingerprint
 * voice, the block menu, and the segment profile to the AI layer.
 */
@Injectable()
export class AssemblyService {
  constructor(private readonly aiService: AiService) {}

  async assembleForSegment(input: {
    newsletterName: string;
    fingerprint: NewsletterFingerprint;
    blocks: ContentBlock[];
    topicNameById: Map<string, string>;
    segment: Segment;
    profile: SegmentProfile;
  }): Promise<string> {
    const voice = this.resolveVoice(input.fingerprint);
    const assemblyBlocks: AssemblyBlock[] = input.blocks.map((block) => ({
      label: block.label,
      intent: block.intent,
      body: block.body,
      topicName: block.topicId ? input.topicNameById.get(block.topicId) : undefined,
    }));
    return this.aiService.assembleVariant({
      newsletterName: input.newsletterName,
      voice,
      blocks: assemblyBlocks,
      segmentName: input.segment.name,
      segmentDescription: input.segment.description ?? input.segment.name,
      topAffinities: input.profile.topAffinities,
      depthPreference: input.profile.depthPreference,
    });
  }

  private resolveVoice(fingerprint: NewsletterFingerprint): FingerprintVoice {
    const voice = fingerprint.voice as unknown as FingerprintVoice | null;
    return (
      voice ?? {
        tone: 'Measured and analytical',
        formality: 'Conversational',
        sentenceRhythm: 'Balanced',
        humor: 'Minimal',
        signaturePhrases: [],
      }
    );
  }
}
