import nodemailer from 'nodemailer';
import { config } from '../config';
import { verificationEmailHtml, passwordResetEmailHtml } from '../templates/verification-email';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.auth.user
        ? {
            user: config.email.auth.user,
            pass: config.email.auth.pass,
          }
        : undefined,
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        console.error('Email service connection error:', error);
      } else {
        console.log('✅ Email service ready');
      }
    });
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: this.stripHtml(options.html),
      });

      console.log(`📧 Email sent to ${options.to}: ${info.messageId}`);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string, userName?: string): Promise<void> {
    const verificationUrl = `${config.frontendUrl}/auth/verify-email?token=${token}`;
    await this.sendEmail({
      to: email,
      subject: '✉️ Verify Your Email - TaskSphere',
      html: verificationEmailHtml(userName, verificationUrl),
    });
  }

  async sendPasswordResetEmail(email: string, token: string, userName?: string): Promise<void> {
    const resetUrl = `${config.frontendUrl}/auth/reset-password?token=${token}`;
    await this.sendEmail({
      to: email,
      subject: '🔐 Reset Your Password - TaskSphere',
      html: passwordResetEmailHtml(userName, resetUrl),
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

// Export singleton instance
export const emailService = new EmailService();