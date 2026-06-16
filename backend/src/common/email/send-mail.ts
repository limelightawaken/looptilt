import { getEmailProvider } from './email-config';
import { SendMailOptions } from './email.types';
import { sendResendMail } from './resend.transport';
import { sendSmtpMail } from './smtp.transport';
import { sendUnosendMail } from './unosend.transport';

export { getEmailProvider } from './email-config';

export async function sendMail(options: SendMailOptions): Promise<void> {
  const provider = getEmailProvider();
  if (provider === 'unosend') {
    await sendUnosendMail(options);
    return;
  }
  if (provider === 'resend') {
    await sendResendMail(options);
    return;
  }
  await sendSmtpMail(options);
}
