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
/** Refresh the access token this many ms before it actually expires. */
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

export interface KitOAuthTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  scope: string | null;
}

/** Persists newly refreshed OAuth tokens so the next request reuses them. */
export type KitTokenPersister = (tokens: KitOAuthTokens) => Promise<void>;

interface KitApiKeyAuth {
  kind: 'apiKey';
  apiKey: string;
}

interface KitOAuthAuth {
  kind: 'oauth';
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  onTokensRefreshed: KitTokenPersister;
}

export type KitAuth = KitApiKeyAuth | KitOAuthAuth;

export interface KitClientOptions {
  baseUrl: string;
  auth: KitAuth;
}

/**
 * Kit (ConvertKit) v4 adapter. Authenticates with either an X-Kit-Api-Key header
 * or an OAuth 2.0 bearer token (refreshing it transparently), applies exponential
 * backoff on 429s (Kit allows 120 req / 60s), and exposes only the operations the
 * loop needs. See kit-api-integration.md for verified shapes.
 */
export class KitClient implements EspAdapter {
  readonly provider = 'KIT' as const;
  private readonly logger = new Logger(KitClient.name);
  private readonly baseUrl: string;
  private readonly auth: KitAuth;

  constructor(options: KitClientOptions) {
    this.baseUrl = options.baseUrl;
    this.auth = options.auth;
  }

  /**
   * Exchanges an authorization code for access + refresh tokens (confidential
   * client; client secret kept server-side).
   */
  static async exchangeAuthorizationCode(params: {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    code: string;
    redirectUri: string;
  }): Promise<KitOAuthTokens> {
    return KitClient.requestTokens(params.tokenUrl, {
      client_id: params.clientId,
      client_secret: params.clientSecret,
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
    });
  }

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
    let refreshed = false;
    for (;;) {
      const headers = await this.authHeaders();
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (response.status === 401 && this.auth.kind === 'oauth' && this.auth.refreshToken && !refreshed) {
        refreshed = true;
        await this.refreshAccessToken();
        continue;
      }
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

  private async authHeaders(): Promise<Record<string, string>> {
    const base = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (this.auth.kind === 'apiKey') {
      return { ...base, 'X-Kit-Api-Key': this.auth.apiKey };
    }
    await this.ensureFreshToken();
    return { ...base, Authorization: `Bearer ${this.auth.accessToken}` };
  }

  /** Proactively refresh when the token is expired (or about to expire). */
  private async ensureFreshToken(): Promise<void> {
    if (this.auth.kind !== 'oauth' || !this.auth.refreshToken || !this.auth.expiresAt) {
      return;
    }
    if (this.auth.expiresAt.getTime() - TOKEN_EXPIRY_BUFFER_MS <= Date.now()) {
      await this.refreshAccessToken();
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (this.auth.kind !== 'oauth' || !this.auth.refreshToken) {
      throw new BadGatewayException('Kit OAuth token expired and no refresh token is available');
    }
    const tokens = await KitClient.requestTokens(this.auth.tokenUrl, {
      client_id: this.auth.clientId,
      client_secret: this.auth.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: this.auth.refreshToken,
    });
    this.auth.accessToken = tokens.accessToken;
    this.auth.refreshToken = tokens.refreshToken ?? this.auth.refreshToken;
    this.auth.expiresAt = tokens.expiresAt;
    await this.auth.onTokensRefreshed({
      accessToken: this.auth.accessToken,
      refreshToken: this.auth.refreshToken,
      expiresAt: this.auth.expiresAt,
      scope: tokens.scope,
    });
  }

  private static async requestTokens(
    tokenUrl: string,
    body: Record<string, string>,
  ): Promise<KitOAuthTokens> {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new BadGatewayException(`Kit OAuth token request failed (${response.status}): ${text}`);
    }
    const data = (text ? JSON.parse(text) : {}) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      created_at?: number;
      scope?: string;
    };
    if (!data.access_token) {
      throw new BadGatewayException('Kit OAuth token response did not include an access token');
    }
    const baseMs =
      typeof data.created_at === 'number' ? data.created_at * 1000 : Date.now();
    const expiresAt =
      typeof data.expires_in === 'number' ? new Date(baseMs + data.expires_in * 1000) : null;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt,
      scope: data.scope ?? null,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
