import { registerAs } from '@nestjs/config';

/**
 * Configuration for ESP integration (Kit/ConvertKit) and the local signal
 * simulator. The simulator is hard-disabled in production.
 */
export default registerAs('esp', () => {
  const appPublicUrl = process.env.APP_PUBLIC_URL || 'http://localhost:3001';
  const apiPrefix = process.env.API_PREFIX || 'api';
  return {
    kitApiBaseUrl: process.env.KIT_API_BASE_URL || 'https://api.kit.com/v4',
    appPublicUrl,
    encryptionKey: process.env.ENCRYPTION_KEY || '',
    enableSimulator: process.env.ENABLE_SIMULATOR === 'true',
    /** Shared secret appended to registered webhook URLs to authenticate inbound Kit calls. */
    webhookSecret: process.env.KIT_WEBHOOK_SECRET || '',
    /** Where the browser is sent after the OAuth flow finishes (frontend app). */
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    kitOauth: {
      clientId: process.env.KIT_OAUTH_CLIENT_ID || '',
      clientSecret: process.env.KIT_OAUTH_CLIENT_SECRET || '',
      authorizeUrl: process.env.KIT_OAUTH_AUTHORIZE_URL || 'https://api.kit.com/v4/oauth/authorize',
      tokenUrl: process.env.KIT_OAUTH_TOKEN_URL || 'https://api.kit.com/v4/oauth/token',
      /** Must exactly match a Redirect URI configured in the Kit app's Distribution tab. */
      redirectUri:
        process.env.KIT_OAUTH_REDIRECT_URI ||
        `${appPublicUrl}/${apiPrefix}/esp/oauth/kit/callback`,
      scope: process.env.KIT_OAUTH_SCOPE || '',
    },
  };
});
