import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EspConnection } from '@prisma/client';
import { CryptoService } from '../../common/crypto/crypto.service';
import { KitClient } from './adapters/kit/kit.client';
import { EspAdapter } from './types/esp.types';

/**
 * Builds a concrete ESP adapter from a stored connection. Only LIVE_KIT
 * connections yield a real client; SIMULATOR connections never reach a live ESP.
 */
@Injectable()
export class EspAdapterFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
  ) {}

  create(connection: EspConnection): EspAdapter {
    if (connection.dataSource !== 'LIVE_KIT') {
      throw new BadRequestException('A live ESP adapter is only available for LIVE_KIT connections');
    }
    if (!connection.apiKeyEncrypted) {
      throw new BadRequestException('Connection is missing a stored API key');
    }
    const apiKey = this.cryptoService.decrypt(connection.apiKeyEncrypted);
    const baseUrl = this.configService.get<string>('esp.kitApiBaseUrl') || 'https://api.kit.com/v4';
    return new KitClient(apiKey, baseUrl);
  }
}
