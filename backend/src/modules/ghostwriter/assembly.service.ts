import { Injectable } from '@nestjs/common';
import { ContentBlock, NewsletterFingerprint, Segment } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { AssemblyBlock, FingerprintVoice } from '../ai/types/ai.types';
import { encodeTopicLink } from '../signals/link-encoder';

export interface SegmentProfile {
  topAffinities: string[];
  depthPreference: string;
}

const URL_PATTERN = /https?:\/\/[^\s)\]"'<>]+/g;

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
    topicSlugById: Map<string, string>;
    segment: Segment;
    profile: SegmentProfile;
  }): Promise<string> {
    const voice = this.resolveVoice(input.fingerprint);
    const blockCount = input.blocks.length;
    const assemblyBlocks: AssemblyBlock[] = input.blocks.map((block, index) => {
      const topicSlug = block.topicId ? input.topicSlugById.get(block.topicId) : undefined;
      // Encode topic + read-depth position into every link so inbound Kit
      // link_click webhooks map back to a fingerprint topic (kit-api §3).
      const position = index < Math.ceil(blockCount / 2) ? 'upper' : 'lower';
      const body =
        topicSlug && block.body ? this.encodeLinks(block.body, topicSlug, position) : block.body ?? undefined;
      const url =
        topicSlug && block.url ? encodeTopicLink(block.url, topicSlug, position) : block.url ?? undefined;
      return {
        kind: block.kind,
        label: block.label,
        intent: block.intent ?? undefined,
        body,
        url,
        topicName: block.topicId ? input.topicNameById.get(block.topicId) : undefined,
      };
    });
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

  private encodeLinks(body: string, topicSlug: string, position: string): string {
    return body.replace(URL_PATTERN, (url) => encodeTopicLink(url, topicSlug, position));
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
