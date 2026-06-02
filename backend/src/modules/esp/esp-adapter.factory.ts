import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EspConnection } from '@prisma/client';
import { CryptoService } from '../../common/crypto/crypto.service';
import { DatabaseService } from '../../common/database/database.service';
import { KitClient, KitOAuthTokens } from './adapters/kit/kit.client';
import { EspAdapter } from './types/esp.types';

/**
 * Builds a concrete ESP adapter from a stored connection. Only LIVE_KIT
 * connections yield a real client; SIMULATOR connections never reach a live ESP.
 * OAuth connections receive a token persister so refreshed tokens are written back.
 */
@Injectable()
export class EspAdapterFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
    private readonly database: DatabaseService,
  ) {}

  create(connection: EspConnection): EspAdapter {
    if (connection.dataSource !== 'LIVE_KIT') {
      throw new BadRequestException('A live ESP adapter is only available for LIVE_KIT connections');
    }
    const baseUrl = this.configService.get<string>('esp.kitApiBaseUrl') || 'https://api.kit.com/v4';

    if (connection.authMethod === 'OAUTH') {
      if (!connection.oauthAccessTokenEncrypted) {
        throw new BadRequestException('Connection is missing a stored OAuth access token');
      }
      const clientId = this.configService.get<string>('esp.kitOauth.clientId') || '';
      const clientSecret = this.configService.get<string>('esp.kitOauth.clientSecret') || '';
      const tokenUrl =
        this.configService.get<string>('esp.kitOauth.tokenUrl') ||
        'https://api.kit.com/v4/oauth/token';
      return new KitClient({
        baseUrl,
        auth: {
          kind: 'oauth',
          accessToken: this.cryptoService.decrypt(connection.oauthAccessTokenEncrypted),
          refreshToken: connection.oauthRefreshTokenEncrypted
            ? this.cryptoService.decrypt(connection.oauthRefreshTokenEncrypted)
            : null,
          expiresAt: connection.oauthTokenExpiresAt,
          clientId,
          clientSecret,
          tokenUrl,
          onTokensRefreshed: this.buildTokenPersister(connection.newsletterId),
        },
      });
    }

    if (!connection.apiKeyEncrypted) {
      throw new BadRequestException('Connection is missing a stored API key');
    }
    return new KitClient({
      baseUrl,
      auth: { kind: 'apiKey', apiKey: this.cryptoService.decrypt(connection.apiKeyEncrypted) },
    });
  }

  private buildTokenPersister(newsletterId: string) {
    return async (tokens: KitOAuthTokens): Promise<void> => {
      await this.database.espConnection.update({
        where: { newsletterId },
        data: {
          oauthAccessTokenEncrypted: this.cryptoService.encrypt(tokens.accessToken),
          oauthRefreshTokenEncrypted: tokens.refreshToken
            ? this.cryptoService.encrypt(tokens.refreshToken)
            : undefined,
          oauthTokenExpiresAt: tokens.expiresAt,
          oauthScope: tokens.scope ?? undefined,
        },
      });
    };
  }
}
