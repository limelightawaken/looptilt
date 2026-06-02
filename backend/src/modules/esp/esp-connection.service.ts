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
import { ConnectEspDto } from './dto/connect-esp.dto';

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
    const connection = await this.database.espConnection.upsert({
      where: { newsletterId },
      create: {
        newsletterId,
        provider: 'KIT',
        dataSource: dto.dataSource,
        isActive: true,
        apiKeyEncrypted,
      },
      update: {
        provider: 'KIT',
        dataSource: dto.dataSource,
        isActive: true,
        apiKeyEncrypted,
      },
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
    const targetUrl = `${publicUrl}/api/webhooks/kit/${newsletterId}`;
    const webhookIds: Record<string, string> = {};
    for (const event of KIT_WEBHOOK_EVENTS) {
      const normalized = event.replace(/^subscriber\./, '');
      const eventTargetUrl = `${targetUrl}?event=${encodeURIComponent(normalized)}`;
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
