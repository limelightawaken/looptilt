import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseService) {}

  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async checkDatabase() {
    try {
      await this.database.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
        message: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
