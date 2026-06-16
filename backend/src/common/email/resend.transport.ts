import {
  DEFAULT_RESEND_API_URL,
  SendMailOptions,
} from './email.types';

interface ResendSendResponse {
  id?: string;
  error?: { message: string };
}

export function getResendApiUrl(env: Record<string, unknown> = process.env): string {
  const url = env.RESEND_API_URL;
  if (typeof url === 'string' && url.trim().length > 0) {
    return url.trim();
  }
  return DEFAULT_RESEND_API_URL;
}

export async function sendResendMail(
  options: SendMailOptions,
  env: Record<string, unknown> = process.env,
): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const from =
    typeof env.SMTP_FROM === 'string' && env.SMTP_FROM.trim().length > 0
      ? env.SMTP_FROM.trim()
      : 'noreply@example.com';

  const response = await fetch(getResendApiUrl(env), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  const body = (await response.json()) as ResendSendResponse;
  if (!response.ok) {
    const message = body.error?.message ?? `Email API error ${response.status}`;
    throw new Error(message);
  }
}
