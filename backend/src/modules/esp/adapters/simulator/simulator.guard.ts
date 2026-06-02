import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Hard production gate for the signal simulator. Returns 403 whenever the app
 * is running in production or the ENABLE_SIMULATOR flag is not explicitly set.
 * Production therefore never serves simulated/seed data.
 */
@Injectable()
export class SimulatorGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(): boolean {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const enabled = this.configService.get<boolean>('esp.enableSimulator') === true;
    if (isProduction || !enabled) {
      throw new ForbiddenException('The signal simulator is disabled in this environment');
    }
    return true;
  }
}
