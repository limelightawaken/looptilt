import { BadGatewayException, Logger } from '@nestjs/common';
import {
  EspAdapter,
  EspBroadcastInput,
  EspBroadcastResult,
  EspSubscriberUpsert,
  EspWebhookRegistration,
} from '../../types/esp.types';

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

/**
 * Kit (ConvertKit) v4 adapter. Authenticates with X-Kit-Api-Key, applies
 * exponential backoff on 429s (Kit allows 120 req / 60s), and exposes only the
 * operations the loop needs. See kit-api-integration.md for verified shapes.
 */
export class KitClient implements EspAdapter {
  readonly provider = 'KIT' as const;
  private readonly logger = new Logger(KitClient.name);

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
  ) {}

  async verifyConnection(): Promise<{ accountId: string }> {
    const data = await this.request<{ account?: { id?: number | string } }>('GET', '/account');
    return { accountId: String(data.account?.id ?? 'unknown') };
  }

  async ensureCustomField(label: string): Promise<string> {
    const existing = await this.request<{ custom_fields?: Array<{ id: number; label: string }> }>(
      'GET',
      '/custom_fields',
    );
    const match = existing.custom_fields?.find((field) => field.label === label);
    if (match) {
      return String(match.id);
    }
    const created = await this.request<{ custom_field?: { id: number } }>(
      'POST',
      '/custom_fields',
      { label },
    );
    return String(created.custom_field?.id ?? '');
  }

  async ensureTag(name: string): Promise<string> {
    const existing = await this.request<{ tags?: Array<{ id: number; name: string }> }>(
      'GET',
      '/tags',
    );
    const match = existing.tags?.find((tag) => tag.name === name);
    if (match) {
      return String(match.id);
    }
    const created = await this.request<{ tag?: { id: number } }>('POST', '/tags', { name });
    return String(created.tag?.id ?? '');
  }

  async upsertSubscriber(input: EspSubscriberUpsert): Promise<{ id: string }> {
    const created = await this.request<{ subscriber?: { id: number } }>('POST', '/subscribers', {
      email_address: input.email,
      first_name: input.firstName,
      fields: input.fields,
    });
    return { id: String(created.subscriber?.id ?? '') };
  }

  async tagSubscriber(tagId: string, subscriberId: string): Promise<void> {
    await this.request('POST', `/tags/${tagId}/subscribers/${subscriberId}`, {});
  }

  async untagSubscriber(tagId: string, subscriberId: string): Promise<void> {
    await this.request('DELETE', `/tags/${tagId}/subscribers/${subscriberId}`);
  }

  async registerWebhook(
    targetUrl: string,
    registration: EspWebhookRegistration,
  ): Promise<string> {
    const created = await this.request<{ webhook?: { id: number } }>('POST', '/webhooks', {
      target_url: targetUrl,
      event: {
        name: registration.event,
        initiator_value: registration.initiatorValue ?? null,
      },
    });
    return String(created.webhook?.id ?? '');
  }

  async createBroadcast(input: EspBroadcastInput): Promise<EspBroadcastResult> {
    if (!input.tagId) {
      throw new BadGatewayException('Refusing to create a broadcast without a target tag');
    }
    const created = await this.request<{ broadcast?: { id: number } }>('POST', '/broadcasts', {
      subject: input.subject,
      content: input.content,
      public: input.publish,
      subscriber_filter: [
        { all: [{ type: 'tag', ids: [Number(input.tagId)] }], any: null, none: null },
      ],
    });
    return { broadcastId: String(created.broadcast?.id ?? ''), isDraft: !input.publish };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    let attempt = 0;
    for (;;) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Kit-Api-Key': this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (response.status === 429 && attempt < MAX_RETRIES) {
        const wait = RETRY_BASE_MS * 2 ** attempt;
        attempt += 1;
        this.logger.warn(`Kit rate-limited; backing off ${wait}ms (attempt ${attempt})`);
        await this.delay(wait);
        continue;
      }
      if (!response.ok) {
        const text = await response.text();
        throw new BadGatewayException(`Kit API ${method} ${path} failed (${response.status}): ${text}`);
      }
      const text = await response.text();
      return (text ? JSON.parse(text) : {}) as T;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
