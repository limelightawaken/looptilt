export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export type EmailProviderName = 'smtp' | 'resend' | 'unosend';

/** Matches the default in @unosend/node. */
export const DEFAULT_UNOSEND_BASE_URL = 'https://api.unosend.co';

export const DEFAULT_RESEND_API_URL = 'https://api.resend.com/emails';
