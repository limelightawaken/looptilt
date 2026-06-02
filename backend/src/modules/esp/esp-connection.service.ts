import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EspConnection, Prisma } from '@prisma/client';
import { DatabaseService } from '../../common/database/database.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { EspAdapterFactory } from './esp-adapter.factory';
import { KitClient } from './adapters/kit/kit.client';
import { ConnectEspDto } from './dto/connect-esp.dto';

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const KIT_WEBHOOK_EVENTS = [
  'subscriber.link_click',
  'subscriber.subscriber_activate',
  'subscriber.subscriber_unsubscribe',
  'subscriber.subscriber_bounce',
  'subscriber.subscriber_complain',
  'subscriber.form_subscribe',
  'subscriber.tag_add',
  'subscriber.tag_remove',
];

/**
 * Manages a newsletter's ESP connection. Enforces the production safety rule:
 * SIMULATOR connections cannot be created in production.
 */
@Injectable()
export class EspConnectionService {
  private readonly logger = new Logger(EspConnectionService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
    private readonly adapterFactory: EspAdapterFactory,
  ) {}

  async connect(userId: string, newsletterId: string, dto: ConnectEspDto): Promise<EspConnection> {
    await this.verifyOwnership(userId, newsletterId);
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    if (dto.dataSource === 'SIMULATOR' && isProduction) {
      throw new ForbiddenException('Demo data mode is disabled in production');
    }
    if (dto.dataSource === 'LIVE_KIT' && !dto.apiKey) {
      throw new BadRequestException('A Kit API key is required for live mode');
    }
    const apiKeyEncrypted = dto.apiKey ? this.cryptoService.encrypt(dto.apiKey) : null;
    const baseData = {
      provider: 'KIT' as const,
      dataSource: dto.dataSource,
      authMethod: 'API_KEY' as const,
      isActive: true,
      apiKeyEncrypted,
      oauthAccessTokenEncrypted: null,
      oauthRefreshTokenEncrypted: null,
      oauthTokenExpiresAt: null,
      oauthScope: null,
    };
    const connection = await this.database.espConnection.upsert({
      where: { newsletterId },
      create: { newsletterId, ...baseData },
      update: baseData,
    });
    await this.database.newsletter.update({
      where: { id: newsletterId },
      data: { espProvider: 'KIT' },
    });
    if (dto.dataSource === 'LIVE_KIT') {
      await this.activateLiveConnection(newsletterId, connection);
    }
    return this.redact(connection);
  }

  async disconnect(userId: string, newsletterId: string): Promise<void> {
    await this.verifyOwnership(userId, newsletterId);
    await this.database.espConnection.deleteMany({ where: { newsletterId } });
    await this.database.newsletter.update({
      where: { id: newsletterId },
      data: { espProvider: 'NONE' },
    });
  }

  async getStatus(userId: string, newsletterId: string): Promise<{
    connected: boolean;
    dataSource: DataSource | null;
    provider: string | null;
    accountId: string | null;
  }> {
    await this.verifyOwnership(userId, newsletterId);
    const connection = await this.database.espConnection.findUnique({ where: { newsletterId } });
    if (!connection) {
      return { connected: false, dataSource: null, provider: null, accountId: null };
    }
    return {
      connected: connection.isActive,
      dataSource: connection.dataSource,
      provider: connection.provider,
      accountId: connection.kitAccountId,
    };
  }

  /**
   * Builds the Kit OAuth authorization URL for a newsletter the user owns and
   * records a short-lived, single-use state token (CSRF protection).
   */
  async buildKitAuthorizeUrl(userId: string, newsletterId: string): Promise<{ url: string }> {
    await this.verifyOwnership(userId, newsletterId);
    const oauth = this.getOAuthConfig();
    const state = randomBytes(32).toString('hex');
    await this.database.espOAuthState.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await this.database.espOAuthState.create({
      data: {
        state,
        userId,
        newsletterId,
        expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
      },
    });
    const params = new URLSearchParams({
      client_id: oauth.clientId,
      response_type: 'code',
      redirect_uri: oauth.redirectUri,
      state,
    });
    if (oauth.scope) {
      params.set('scope', oauth.scope);
    }
    return { url: `${oauth.authorizeUrl}?${params.toString()}` };
  }

  /**
   * Completes the OAuth flow: validates the state, exchanges the authorization
   * code for tokens, stores them encrypted, and activates the live connection
   * (verify account + register webhooks). Returns the newsletter id for redirect.
   */
  async completeKitOAuth(code: string, state: string): Promise<{ newsletterId: string }> {
    if (!code || !state) {
      throw new BadRequestException('Missing authorization code or state');
    }
    const oauth = this.getOAuthConfig();
    const record = await this.database.espOAuthState.findUnique({ where: { state } });
    if (!record || record.expiresAt.getTime() < Date.now()) {
      if (record) {
        await this.database.espOAuthState.delete({ where: { state } }).catch(() => undefined);
      }
      throw new BadRequestException('Invalid or expired OAuth state');
    }
    await this.database.espOAuthState.delete({ where: { state } }).catch(() => undefined);
    await this.verifyOwnership(record.userId, record.newsletterId);

    const tokens = await KitClient.exchangeAuthorizationCode({
      tokenUrl: oauth.tokenUrl,
      clientId: oauth.clientId,
      clientSecret: oauth.clientSecret,
      code,
      redirectUri: oauth.redirectUri,
    });

    const data = {
      provider: 'KIT' as const,
      dataSource: 'LIVE_KIT' as const,
      authMethod: 'OAUTH' as const,
      isActive: true,
      apiKeyEncrypted: null,
      oauthAccessTokenEncrypted: this.cryptoService.encrypt(tokens.accessToken),
      oauthRefreshTokenEncrypted: tokens.refreshToken
        ? this.cryptoService.encrypt(tokens.refreshToken)
        : null,
      oauthTokenExpiresAt: tokens.expiresAt,
      oauthScope: tokens.scope,
    };
    const connection = await this.database.espConnection.upsert({
      where: { newsletterId: record.newsletterId },
      create: { newsletterId: record.newsletterId, ...data },
      update: data,
    });
    await this.database.newsletter.update({
      where: { id: record.newsletterId },
      data: { espProvider: 'KIT' },
    });
    await this.activateLiveConnection(record.newsletterId, connection);
    return { newsletterId: record.newsletterId };
  }

  private getOAuthConfig(): {
    clientId: string;
    clientSecret: string;
    authorizeUrl: string;
    tokenUrl: string;
    redirectUri: string;
    scope: string;
  } {
    const clientId = this.configService.get<string>('esp.kitOauth.clientId') || '';
    const clientSecret = this.configService.get<string>('esp.kitOauth.clientSecret') || '';
    const authorizeUrl = this.configService.get<string>('esp.kitOauth.authorizeUrl') || '';
    const tokenUrl = this.configService.get<string>('esp.kitOauth.tokenUrl') || '';
    const redirectUri = this.configService.get<string>('esp.kitOauth.redirectUri') || '';
    const scope = this.configService.get<string>('esp.kitOauth.scope') || '';
    if (!clientId || !clientSecret || !authorizeUrl || !tokenUrl || !redirectUri) {
      throw new BadRequestException(
        'Kit OAuth is not configured. Set KIT_OAUTH_CLIENT_ID, KIT_OAUTH_CLIENT_SECRET, and the redirect/token URLs.',
      );
    }
    return { clientId, clientSecret, authorizeUrl, tokenUrl, redirectUri, scope };
  }

  /** Frontend URL the browser is redirected to after the OAuth flow finishes. */
  getOAuthFrontendUrl(): string {
    return this.configService.get<string>('esp.frontendUrl') || 'http://localhost:3000';
  }

  async requireConnection(newsletterId: string): Promise<EspConnection> {
    const connection = await this.database.espConnection.findUnique({ where: { newsletterId } });
    if (!connection || !connection.isActive) {
      throw new BadRequestException('No active ESP connection for this newsletter');
    }
    return connection;
  }

  private async activateLiveConnection(
    newsletterId: string,
    connection: EspConnection,
  ): Promise<void> {
    const adapter = this.adapterFactory.create(connection);
    const { accountId } = await adapter.verifyConnection();
    const publicUrl = this.configService.get<string>('esp.appPublicUrl') || '';
    const webhookSecret = this.configService.get<string>('esp.webhookSecret') || '';
    const targetUrl = `${publicUrl}/api/webhooks/kit/${newsletterId}`;
    const secretParam = webhookSecret ? `&secret=${encodeURIComponent(webhookSecret)}` : '';
    const webhookIds: Record<string, string> = {};
    for (const event of KIT_WEBHOOK_EVENTS) {
      const normalized = event.replace(/^subscriber\./, '');
      const eventTargetUrl = `${targetUrl}?event=${encodeURIComponent(normalized)}${secretParam}`;
      try {
        webhookIds[event] = await adapter.registerWebhook(eventTargetUrl, { event });
      } catch (error) {
        this.logger.warn(`Failed to register Kit webhook ${event}: ${String(error)}`);
      }
    }
    await this.database.espConnection.update({
      where: { newsletterId },
      data: {
        kitAccountId: accountId,
        webhookIds: webhookIds as unknown as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
    });
  }

  private redact(connection: EspConnection): EspConnection {
    return { ...connection, apiKeyEncrypted: connection.apiKeyEncrypted ? '***' : null };
  }

  private async verifyOwnership(userId: string, newsletterId: string): Promise<void> {
    const newsletter = await this.database.newsletter.findUnique({
      where: { id: newsletterId },
      select: { userId: true },
    });
    if (!newsletter) {
      throw new NotFoundException(`Newsletter ${newsletterId} not found`);
    }
    if (newsletter.userId !== userId) {
      throw new ForbiddenException('You do not have access to this newsletter');
    }
  }
}
