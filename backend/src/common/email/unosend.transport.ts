import { Unosend } from '@unosend/node';
import { resolveUnosendApiKey, resolveUnosendBaseUrl } from './email-config';
import { SendMailOptions } from './email.types';

export async function sendUnosendMail(
  options: SendMailOptions,
  env: Record<string, unknown> = process.env,
): Promise<void> {
  const apiKey = resolveUnosendApiKey(env);
  if (!apiKey) {
    throw new Error('UNOSEND_API_KEY is not configured');
  }

  const from =
    typeof env.SMTP_FROM === 'string' && env.SMTP_FROM.trim().length > 0
      ? env.SMTP_FROM.trim()
      : 'noreply@example.com';

  const unosend = new Unosend({
    apiKey,
    baseUrl: resolveUnosendBaseUrl(env),
  });

  const { data, error } = await unosend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data?.id) {
    throw new Error('Unosend did not return an email id');
  }
}
