import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../common/database/database.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
  ) {}

  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async readiness() {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const simulatorEnabled =
      !isProduction && this.configService.get<boolean>('esp.enableSimulator') === true;
    const connections = await this.database.espConnection.findMany({
      where: { isActive: true },
      select: { dataSource: true },
    });
    const connectionsByDataSource = connections.reduce<Record<string, number>>((acc, row) => {
      acc[row.dataSource] = (acc[row.dataSource] ?? 0) + 1;
      return acc;
    }, {});
    return {
      status: 'ok',
      environment: isProduction ? 'production' : 'non-production',
      aiProvider: this.aiService.activeProvider,
      simulatorEnabled,
      connectionsByDataSource,
      timestamp: new Date().toISOString(),
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
