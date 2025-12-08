import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getInfo() {
    return {
      name: 'Tayo-Starter API',
      version: '1.0.0',
      environment: this.configService.get<string>('NODE_ENV', 'development'),
    };
  }
}
