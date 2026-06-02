import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getInfo() {
    return {
      name: 'LoopTilt API',
      description: 'Newsletter Fingerprint Engine — understand your content, draft in your voice, personalize at scale.',
      version: '1.0.0',
      environment: this.configService.get<string>('NODE_ENV', 'development'),
    };
  }
}
