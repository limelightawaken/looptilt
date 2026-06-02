import { Body, Controller, HttpCode, Param, Post, Query } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { SignalsService } from './signals.service';

/**
 * Inbound webhook endpoint for Kit. Responds 2xx fast; processing is best-effort
 * and never throws back to Kit (which would trigger retries). The event type and
 * a shared secret are carried as query params set during webhook registration.
 */
@ApiTags('signals')
@Controller('webhooks/kit')
export class SignalsController {
  constructor(
    private readonly signalsService: SignalsService,
    private readonly configService: ConfigService,
  ) {}

  @Post(':newsletterId')
  @AllowAnonymous()
  @SkipThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'Kit webhook receiver (link clicks + lifecycle events)' })
  @ApiParam({ name: 'newsletterId', description: 'Newsletter ID' })
  @ApiQuery({ name: 'event', required: true, description: 'Kit event name' })
  @ApiQuery({ name: 'secret', required: false, description: 'Shared webhook secret' })
  async receive(
    @Param('newsletterId') newsletterId: string,
    @Query('event') event: string,
    @Query('secret') secret: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<{ received: boolean }> {
    const expectedSecret = this.configService.get<string>('esp.webhookSecret') || '';
    if (expectedSecret && !this.secretMatches(secret, expectedSecret)) {
      // Reject forged events when a secret is configured; ack without processing.
      return { received: false };
    }
    try {
      await this.signalsService.ingestKitEvent(newsletterId, event ?? '', payload);
    } catch {
      // Swallow: acknowledge fast so Kit does not retry; failures are logged in the service.
    }
    return { received: true };
  }

  /** Constant-time comparison to avoid leaking the webhook secret via timing. */
  private secretMatches(provided: string, expected: string): boolean {
    const a = Buffer.from(provided ?? '');
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  }
}
