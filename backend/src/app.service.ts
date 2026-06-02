import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getInfo() {
    return {
      name: 'LoopTilt API',
      description:
        'Newsletter personalization for Kit — understand your content via a newsletter fingerprint, draft in your voice, and personalize per segment.',
      version: '1.0.0',
      environment: this.configService.get<string>('NODE_ENV', 'development'),
    };
  }
}
