import { registerAs } from '@nestjs/config';

/**
 * Configuration for ESP integration (Kit/ConvertKit) and the local signal
 * simulator. The simulator is hard-disabled in production.
 */
export default registerAs('esp', () => ({
  kitApiBaseUrl: process.env.KIT_API_BASE_URL || 'https://api.kit.com/v4',
  appPublicUrl: process.env.APP_PUBLIC_URL || 'http://localhost:3001',
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  enableSimulator: process.env.ENABLE_SIMULATOR === 'true',
}));
