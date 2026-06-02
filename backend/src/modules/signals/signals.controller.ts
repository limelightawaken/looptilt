import { Body, Controller, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { SignalsService } from './signals.service';

/**
 * Inbound webhook endpoint for Kit. Responds 2xx fast; processing is best-effort
 * and never throws back to Kit (which would trigger retries). The event type is
 * carried as a query param set during webhook registration.
 */
@ApiTags('signals')
@Controller('webhooks/kit')
export class SignalsController {
  constructor(private readonly signalsService: SignalsService) {}

  @Post(':newsletterId')
  @AllowAnonymous()
  @HttpCode(200)
  @ApiOperation({ summary: 'Kit webhook receiver (link clicks + lifecycle events)' })
  @ApiParam({ name: 'newsletterId', description: 'Newsletter ID' })
  @ApiQuery({ name: 'event', required: true, description: 'Kit event name' })
  async receive(
    @Param('newsletterId') newsletterId: string,
    @Query('event') event: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<{ received: boolean }> {
    try {
      await this.signalsService.ingestKitEvent(newsletterId, event ?? '', payload);
    } catch {
      // Swallow: acknowledge fast so Kit does not retry; failures are logged in the service.
    }
    return { received: true };
  }
}
