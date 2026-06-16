import * as nodemailer from 'nodemailer';

export const PRODUCTION_SMTP_ENV_KEYS = [
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
] as const;

export const PRODUCTION_RESEND_ENV_KEYS = ['RESEND_API_KEY', 'SMTP_FROM'] as const;

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

export function getMissingEmailEnvKeys(
  env: Record<string, unknown> = process.env,
): string[] {
  return env.EMAIL_PROVIDER === 'resend'
    ? getMissingResendEnvKeys(env)
    : getMissingSmtpEnvKeys(env);
}

export function createSmtpTransporter(): nodemailer.Transporter {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS required).');
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user, pass },
  });
}

export async function sendSmtpMail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<void> {
  const from = process.env.SMTP_FROM?.trim() || 'noreply@example.com';
  const transporter = createSmtpTransporter();
  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}
