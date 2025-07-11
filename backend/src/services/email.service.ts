import nodemailer from 'nodemailer';
import { User, UserStatus } from '@prisma/client';
import logger from '../utils/logger';
import { EventEmitter, Events } from './events.service';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  private static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@example.com',
        ...options,
      });

      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });

      EventEmitter.emit(Events.EMAIL_SENT, {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });
    } catch (error) {
      logger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
        error,
      });

      EventEmitter.emit(Events.EMAIL_FAILED, {
        email: options.to,
        subject: options.subject,
        error,
      });

      throw error;
    }
  }

  static async sendWelcomeEmail(
    user: User,
    options: {
      temporaryPassword?: string;
      requirePasswordChange: boolean;
    }
  ): Promise<void> {
    const subject = 'Welcome to Our Platform';
    const html = `
      <h1>Welcome ${user.firstName}!</h1>
      <p>Your account has been created successfully.</p>
      <p><strong>Email:</strong> ${user.email}</p>
      ${options.temporaryPassword ? `
        <p><strong>Temporary Password:</strong> ${options.temporaryPassword}</p>
        <p>Please change your password after your first login.</p>
      ` : ''}
      <p>Best regards,<br>The Team</p>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  static async sendVerificationEmail(user: User, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const subject = 'Verify Your Email Address';
    const html = `
      <h1>Email Verification</h1>
      <p>Hi ${user.firstName},</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>Best regards,<br>The Team</p>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  static async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const subject = 'Password Reset Request';
    const html = `
      <h1>Password Reset</h1>
      <p>Hi ${user.firstName},</p>
      <p>We received a request to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The Team</p>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  static async sendStatusChangeNotification(
    user: User,
    details: {
      oldStatus: UserStatus;
      newStatus: UserStatus;
      reason?: string;
      suspensionEndDate?: string;
    }
  ): Promise<void> {
    const subject = 'Account Status Update';
    let statusMessage = '';

    switch (details.newStatus) {
      case UserStatus.ACTIVE:
        statusMessage = 'Your account has been activated.';
        break;
      case UserStatus.INACTIVE:
        statusMessage = 'Your account has been deactivated.';
        break;
      case UserStatus.SUSPENDED:
        statusMessage = 'Your account has been suspended.';
        break;
    }

    const html = `
      <h1>Account Status Update</h1>
      <p>Hi ${user.firstName},</p>
      <p>${statusMessage}</p>
      ${details.reason ? `<p><strong>Reason:</strong> ${details.reason}</p>` : ''}
      ${details.suspensionEndDate ? `<p><strong>Suspension ends:</strong> ${new Date(details.suspensionEndDate).toLocaleDateString()}</p>` : ''}
      <p>If you have any questions, please contact support.</p>
      <p>Best regards,<br>The Team</p>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  static async sendRoleChangeNotification(
    user: User,
    details: {
      oldRole: string;
      newRole: string;
      reason?: string;
    }
  ): Promise<void> {
    const subject = 'Role Update Notification';
    const html = `
      <h1>Role Update</h1>
      <p>Hi ${user.firstName},</p>
      <p>Your role has been updated from <strong>${details.oldRole}</strong> to <strong>${details.newRole}</strong>.</p>
      ${details.reason ? `<p><strong>Reason:</strong> ${details.reason}</p>` : ''}
      <p>This change may affect your access permissions. Please log out and log back in for the changes to take effect.</p>
      <p>Best regards,<br>The Team</p>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  static async sendPasswordExpiryWarning(
    user: User,
    daysUntilExpiry: number
  ): Promise<void> {
    const subject = 'Password Expiry Warning';
    const html = `
      <h1>Password Expiry Warning</h1>
      <p>Hi ${user.firstName},</p>
      <p>Your password will expire in <strong>${daysUntilExpiry} days</strong>.</p>
      <p>Please log in and change your password to avoid any interruption to your account access.</p>
      <p><a href="${process.env.FRONTEND_URL}/change-password" style="display: inline-block; padding: 10px 20px; background-color: #ffc107; color: black; text-decoration: none; border-radius: 5px;">Change Password</a></p>
      <p>Best regards,<br>The Team</p>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  static async sendBulkUpdateNotification(
    userId: string,
    changes: any,
    reason: string
  ): Promise<void> {
    // This would fetch user details and send notification
    // Implementation depends on specific requirements
  }

  static async sendImportSuccessNotification(
    email: string,
    importId: string,
    stats: {
      total: number;
      created: number;
      updated: number;
      failed: number;
    }
  ): Promise<void> {
    const subject = 'User Import Completed';
    const html = `
      <h1>Import Completed Successfully</h1>
      <p>Your user import (ID: ${importId}) has been completed.</p>
      <h2>Summary:</h2>
      <ul>
        <li>Total rows: ${stats.total}</li>
        <li>Users created: ${stats.created}</li>
        <li>Users updated: ${stats.updated}</li>
        <li>Failed rows: ${stats.failed}</li>
      </ul>
      <p>You can view the detailed import log in the admin panel.</p>
      <p>Best regards,<br>The Team</p>
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  static async sendExportReadyNotification(
    email: string,
    downloadUrl: string,
    expiresIn: string
  ): Promise<void> {
    const subject = 'Your Export is Ready';
    const html = `
      <h1>Export Ready for Download</h1>
      <p>Your user data export is ready for download.</p>
      <p><a href="${downloadUrl}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Download Export</a></p>
      <p>This link will expire in ${expiresIn}.</p>
      <p>Best regards,<br>The Team</p>
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  static async sendSecurityAlert(
    user: User,
    alert: {
      type: string;
      description: string;
      ipAddress?: string;
      timestamp: Date;
    }
  ): Promise<void> {
    const subject = 'Security Alert';
    const html = `
      <h1>Security Alert</h1>
      <p>Hi ${user.firstName},</p>
      <p>We detected unusual activity on your account:</p>
      <p><strong>${alert.type}</strong></p>
      <p>${alert.description}</p>
      ${alert.ipAddress ? `<p>IP Address: ${alert.ipAddress}</p>` : ''}
      <p>Time: ${alert.timestamp.toLocaleString()}</p>
      <p>If this wasn't you, please secure your account immediately by changing your password.</p>
      <p><a href="${process.env.FRONTEND_URL}/change-password" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Change Password</a></p>
      <p>Best regards,<br>The Security Team</p>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  // Batch email sending
  static async sendBatchEmails(
    recipients: Array<{
      email: string;
      firstName: string;
      data?: any;
    }>,
    template: {
      subject: string;
      body: (recipient: any) => string;
    }
  ): Promise<void> {
    const batchSize = 50;
    const batches = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await Promise.all(
        batch.map(recipient =>
          this.sendEmail({
            to: recipient.email,
            subject: template.subject,
            html: template.body(recipient),
          }).catch(error => {
            logger.error('Failed to send batch email', {
              email: recipient.email,
              error,
            });
          })
        )
      );

      // Add delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}