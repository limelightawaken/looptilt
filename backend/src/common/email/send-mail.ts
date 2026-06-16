import { EmailProviderName, SendMailOptions } from './email.types';
import { sendResendMail } from './resend.transport';
import { sendSmtpMail } from './smtp.transport';

export function getEmailProvider(
  env: Record<string, unknown> = process.env,
): EmailProviderName {
  return env.EMAIL_PROVIDER === 'resend' ? 'resend' : 'smtp';
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  if (getEmailProvider() === 'resend') {
    await sendResendMail(options);
    return;
  }
  await sendSmtpMail(options);
}
