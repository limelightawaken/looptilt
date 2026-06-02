import { Controller, Get, Logger, Query, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { Response } from 'express';
import { EspConnectionService } from './esp-connection.service';

/**
 * Public landing endpoint Kit redirects the browser to after OAuth consent.
 * It is anonymous (no app session is guaranteed on a top-level redirect); the
 * single-use state token validated during exchange ties the flow to the owner.
 */
@Controller('esp/oauth/kit')
export class KitOAuthController {
  private readonly logger = new Logger(KitOAuthController.name);

  constructor(private readonly connectionService: EspConnectionService) {}

  @Get('callback')
  @AllowAnonymous()
  @SkipThrottle()
  @ApiExcludeEndpoint()
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ): Promise<void> {
    const frontend = this.connectionService.getOAuthFrontendUrl().replace(/\/$/, '');
    if (error) {
      this.logger.warn(`Kit OAuth returned error: ${error}`);
      res.redirect(`${frontend}/dashboard/newsletters?esp=error`);
      return;
    }
    try {
      const { newsletterId } = await this.connectionService.completeKitOAuth(code, state);
      res.redirect(`${frontend}/dashboard/newsletters/${newsletterId}?esp=connected`);
    } catch (err) {
      this.logger.warn(`Kit OAuth callback failed: ${String(err)}`);
      res.redirect(`${frontend}/dashboard/newsletters?esp=error`);
    }
  }
}
