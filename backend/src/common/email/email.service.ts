import { Injectable, Logger } from '@nestjs/common';
import { sendSmtpMail } from './smtp.transport';

interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      await sendSmtpMail(options);
      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Welcome to LoopTilt!',
      html: `
        <h1>Welcome, ${name}!</h1>
        <p>Thank you for joining LoopTilt. Import your archive, generate your fingerprint, and start drafting in your voice.</p>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    await this.sendMail({
      to,
      subject: 'Reset Your Password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }
}
