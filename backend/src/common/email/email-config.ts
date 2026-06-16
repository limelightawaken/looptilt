import { DEFAULT_UNOSEND_BASE_URL, EmailProviderName } from './email.types';

export const PRODUCTION_SMTP_ENV_KEYS = [
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
] as const;

export const PRODUCTION_RESEND_ENV_KEYS = ['RESEND_API_KEY', 'SMTP_FROM'] as const;

export const PRODUCTION_UNOSEND_ENV_KEYS = ['SMTP_FROM'] as const;

export function resolveUnosendApiKey(env: Record<string, unknown> = process.env): string | null {
  for (const key of ['UNOSEND_API_KEY', 'RESEND_API_KEY'] as const) {
    const value = env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

/** Strips legacy full send URLs down to the SDK base URL. */
export function resolveUnosendBaseUrl(env: Record<string, unknown> = process.env): string {
  const configured = env.UNOSEND_BASE_URL;
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return configured.trim().replace(/\/$/, '');
  }

  const legacyUrl = env.RESEND_API_URL;
  if (typeof legacyUrl === 'string' && legacyUrl.trim().length > 0) {
    return legacyUrl
      .trim()
      .replace(/\/v1\/emails\/?$/, '')
      .replace(/\/emails\/?$/, '');
  }

  return DEFAULT_UNOSEND_BASE_URL;
}

function usesUnosendCredentials(env: Record<string, unknown>): boolean {
  const apiKey = resolveUnosendApiKey(env);
  if (apiKey?.startsWith('un_')) {
    return true;
  }
  const baseUrl = resolveUnosendBaseUrl(env);
  return baseUrl.includes('unosend.co');
}

export function getEmailProvider(
  env: Record<string, unknown> = process.env,
): EmailProviderName {
  const provider = env.EMAIL_PROVIDER;
  if (provider === 'unosend') {
    return 'unosend';
  }
  if (provider === 'resend') {
    return usesUnosendCredentials(env) ? 'unosend' : 'resend';
  }
  return 'smtp';
}

export function getMissingSmtpEnvKeys(
  env: Record<string, unknown> = process.env,
): string[] {
  return PRODUCTION_SMTP_ENV_KEYS.filter((key) => {
    const value = env[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });
}

export function getMissingResendEnvKeys(
  env: Record<string, unknown> = process.env,
): string[] {
  return PRODUCTION_RESEND_ENV_KEYS.filter((key) => {
    const value = env[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });
}

export function getMissingUnosendEnvKeys(
  env: Record<string, unknown> = process.env,
): string[] {
  const missing: string[] = [];
  if (!resolveUnosendApiKey(env)) {
    missing.push('UNOSEND_API_KEY');
  }
  const from = env.SMTP_FROM;
  if (typeof from !== 'string' || from.trim().length === 0) {
    missing.push('SMTP_FROM');
  }
  return missing;
}

export function getMissingEmailEnvKeys(
  env: Record<string, unknown> = process.env,
): string[] {
  const provider = getEmailProvider(env);
  if (provider === 'unosend') {
    return getMissingUnosendEnvKeys(env);
  }
  if (provider === 'resend') {
    return getMissingResendEnvKeys(env);
  }
  return getMissingSmtpEnvKeys(env);
}
