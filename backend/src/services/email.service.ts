import { Resend } from 'resend';
import { config } from '../config';
import { verificationEmailHtml, passwordResetEmailHtml } from '../templates/verification-email';

const resend = new Resend(config.email.resendApiKey);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<void> {
  const { error } = await resend.emails.send({
    from: config.email.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  if (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }

  console.log(`📧 Email sent to ${options.to}`);
}

export const emailService = {
  async sendVerificationEmail(email: string, token: string, userName?: string): Promise<void> {
    const verificationUrl = `${config.frontendUrl}/auth/verify-email?token=${token}`;
    await sendEmail({
      to: email,
      subject: '✉️ Verify Your Email - TaskSphere',
      html: verificationEmailHtml(userName, verificationUrl),
    });
  },

  async sendPasswordResetEmail(email: string, token: string, userName?: string): Promise<void> {
    const resetUrl = `${config.frontendUrl}/auth/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: '🔐 Reset Your Password - TaskSphere',
      html: passwordResetEmailHtml(userName, resetUrl),
    });
  },
};
