export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export type EmailProviderName = 'smtp' | 'resend';

export const DEFAULT_RESEND_API_URL = 'https://api.resend.com/emails';
export const UNOSEND_API_URL = 'https://api.unosend.co/v1/emails';
