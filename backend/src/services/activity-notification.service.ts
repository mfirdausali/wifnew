import { activityService } from './activity.service';
import { emailService } from './email.service';
import { WebSocketService } from './websocket.service';
import { PrismaClient, UserRole } from '@prisma/client';
import logger from '../utils/logger';
import cron from 'node-cron';

const prisma = new PrismaClient();

interface NotificationRule {
  id: string;
  event: string;
  condition?: (data: any) => boolean;
  recipients: string[] | ((data: any) => Promise<string[]>);
  template: string;
  channels: ('email' | 'websocket' | 'sms')[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

class ActivityNotificationService {
  private static instance: ActivityNotificationService;
  private notificationRules: NotificationRule[] = [];
  private digestSchedule: Map<string, any[]> = new Map();

  private constructor() {
    this.initializeRules();
    this.setupEventListeners();
    this.startDigestScheduler();
  }

  static getInstance(): ActivityNotificationService {
    if (!ActivityNotificationService.instance) {
      ActivityNotificationService.instance = new ActivityNotificationService();
    }
    return ActivityNotificationService.instance;
  }

  private initializeRules() {
    // Failed login attempts
    this.notificationRules.push({
      id: 'failed_login_multiple',
      event: 'security:failed_login',
      condition: async (data) => {
        const count = await this.getRecentFailedLogins(data.userId);
        return count >= 3;
      },
      recipients: async (data) => {
        const admins = await this.getAdminEmails();
        return [...admins, data.userId];
      },
      template: 'failed_login_alert',
      channels: ['email', 'websocket'],
      priority: 'high',
    });

    // Permission changes
    this.notificationRules.push({
      id: 'permission_granted',
      event: 'security:permission_change',
      recipients: async (data) => {
        const user = await prisma.user.findUnique({
          where: { id: data.details.targetUserId },
          select: { email: true },
        });
        return user ? [user.email, data.details.grantedBy] : [];
      },
      template: 'permission_change',
      channels: ['email', 'websocket'],
      priority: 'medium',
    });

    // Suspicious activity
    this.notificationRules.push({
      id: 'suspicious_activity',
      event: 'security:suspicious_activity',
      recipients: async (data) => {
        const admins = await this.getAdminEmails();
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          select: { email: true },
        });
        return user ? [...admins, user.email] : admins;
      },
      template: 'suspicious_activity_alert',
      channels: ['email', 'websocket'],
      priority: 'critical',
    });

    // High-risk operations
    this.notificationRules.push({
      id: 'high_risk_operation',
      event: 'activity',
      condition: (data) => {
        const highRiskActions = [
          'USER_DELETE',
          'BULK_DELETE',
          'PERMISSION_GRANT',
          'DATA_EXPORT',
          'SYSTEM_CONFIG_CHANGE',
        ];
        return highRiskActions.includes(data.action);
      },
      recipients: async () => this.getAdminEmails(),
      template: 'high_risk_operation',
      channels: ['websocket'],
      priority: 'high',
    });

    // Large data exports
    this.notificationRules.push({
      id: 'large_export',
      event: 'activity',
      condition: (data) => {
        return data.action === 'DATA_EXPORT' && 
               data.details?.recordCount > 1000;
      },
      recipients: async () => this.getSecurityTeamEmails(),
      template: 'large_export_alert',
      channels: ['email', 'websocket'],
      priority: 'medium',
    });
  }

  private setupEventListeners() {
    // Listen to activity events
    activityService.on('activity', (data) => this.handleActivityEvent('activity', data));
    activityService.on('security:failed_login', (data) => this.handleActivityEvent('security:failed_login', data));
    activityService.on('security:permission_change', (data) => this.handleActivityEvent('security:permission_change', data));
    activityService.on('security:suspicious_activity', (data) => this.handleActivityEvent('security:suspicious_activity', data));
  }

  private async handleActivityEvent(eventType: string, data: any) {
    try {
      // Find matching rules
      const matchingRules = await this.getMatchingRules(eventType, data);

      for (const rule of matchingRules) {
        await this.processNotificationRule(rule, data);
      }
    } catch (error) {
      logger.error('Failed to handle activity event:', error);
    }
  }

  private async getMatchingRules(eventType: string, data: any): Promise<NotificationRule[]> {
    const rules = this.notificationRules.filter(rule => rule.event === eventType);
    const matchingRules: NotificationRule[] = [];

    for (const rule of rules) {
      if (!rule.condition || await rule.condition(data)) {
        matchingRules.push(rule);
      }
    }

    return matchingRules;
  }

  private async processNotificationRule(rule: NotificationRule, data: any) {
    try {
      // Get recipients
      const recipients = typeof rule.recipients === 'function' 
        ? await rule.recipients(data)
        : rule.recipients;

      if (recipients.length === 0) return;

      // Send notifications through configured channels
      const notifications = [];

      if (rule.channels.includes('email')) {
        notifications.push(this.sendEmailNotification(recipients, rule, data));
      }

      if (rule.channels.includes('websocket')) {
        notifications.push(this.sendWebSocketNotification(recipients, rule, data));
      }

      await Promise.all(notifications);

      // Log notification sent
      logger.info('Activity notification sent', {
        ruleId: rule.id,
        recipients: recipients.length,
        channels: rule.channels,
        priority: rule.priority,
      });
    } catch (error) {
      logger.error('Failed to process notification rule:', error);
    }
  }

  private async sendEmailNotification(recipients: string[], rule: NotificationRule, data: any) {
    try {
      const template = this.getEmailTemplate(rule.template, data);
      
      await Promise.all(recipients.map(recipient =>
        emailService.sendEmail({
          to: recipient,
          subject: template.subject,
          html: template.html,
          priority: rule.priority,
        })
      ));
    } catch (error) {
      logger.error('Failed to send email notification:', error);
    }
  }

  private async sendWebSocketNotification(recipients: string[], rule: NotificationRule, data: any) {
    try {
      const notification = {
        type: 'activity_alert',
        priority: rule.priority,
        title: this.getNotificationTitle(rule.template, data),
        message: this.getNotificationMessage(rule.template, data),
        data: {
          ruleId: rule.id,
          activityId: data.id,
          timestamp: new Date(),
        },
      };

      // Send to WebSocket service (implementation depends on your WebSocket setup)
      await WebSocketService.broadcast(recipients, notification);
    } catch (error) {
      logger.error('Failed to send WebSocket notification:', error);
    }
  }

  private getEmailTemplate(templateName: string, data: any): { subject: string; html: string } {
    const templates: Record<string, (data: any) => { subject: string; html: string }> = {
      failed_login_alert: (data) => ({
        subject: 'Security Alert: Multiple Failed Login Attempts',
        html: `
          <h2>Security Alert</h2>
          <p>Multiple failed login attempts have been detected for user ${data.userId}.</p>
          <p><strong>IP Address:</strong> ${data.ipAddress}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p>Please review the account security and take appropriate action.</p>
        `,
      }),
      permission_change: (data) => ({
        subject: 'Permission Change Notification',
        html: `
          <h2>Permission Change</h2>
          <p>Your permissions have been updated.</p>
          <p><strong>Changed by:</strong> ${data.details.grantedBy}</p>
          <p><strong>Permissions:</strong> ${data.details.permissions?.join(', ')}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        `,
      }),
      suspicious_activity_alert: (data) => ({
        subject: 'Critical: Suspicious Activity Detected',
        html: `
          <h2>Suspicious Activity Alert</h2>
          <p>Suspicious activity has been detected for user ${data.userId}.</p>
          <h3>Reasons:</h3>
          <ul>
            ${data.reasons.map((reason: string) => `<li>${reason}</li>`).join('')}
          </ul>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p>Immediate review recommended.</p>
        `,
      }),
      high_risk_operation: (data) => ({
        subject: `High Risk Operation: ${data.action}`,
        html: `
          <h2>High Risk Operation Performed</h2>
          <p><strong>Action:</strong> ${data.action}</p>
          <p><strong>User:</strong> ${data.userId}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p>Please review this operation for compliance.</p>
        `,
      }),
      large_export_alert: (data) => ({
        subject: 'Large Data Export Detected',
        html: `
          <h2>Large Data Export</h2>
          <p>A large data export has been performed.</p>
          <p><strong>Records Exported:</strong> ${data.details.recordCount}</p>
          <p><strong>User:</strong> ${data.userId}</p>
          <p><strong>Format:</strong> ${data.details.format}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        `,
      }),
    };

    const template = templates[templateName];
    return template ? template(data) : {
      subject: 'Activity Notification',
      html: `<p>Activity notification for ${templateName}</p>`,
    };
  }

  private getNotificationTitle(templateName: string, data: any): string {
    const titles: Record<string, string> = {
      failed_login_alert: 'Multiple Failed Login Attempts',
      permission_change: 'Permission Change',
      suspicious_activity_alert: 'Suspicious Activity Detected',
      high_risk_operation: `High Risk: ${data.action}`,
      large_export_alert: 'Large Data Export',
    };
    return titles[templateName] || 'Activity Alert';
  }

  private getNotificationMessage(templateName: string, data: any): string {
    const messages: Record<string, string> = {
      failed_login_alert: `Multiple failed login attempts detected from ${data.ipAddress}`,
      permission_change: 'Your permissions have been updated',
      suspicious_activity_alert: `${data.reasons.length} suspicious indicators detected`,
      high_risk_operation: `User ${data.userId} performed ${data.action}`,
      large_export_alert: `${data.details.recordCount} records exported`,
    };
    return messages[templateName] || 'New activity alert';
  }

  private async getRecentFailedLogins(userId: string): Promise<number> {
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    const { activities } = await activityService.getActivities({
      userId,
      action: 'LOGIN_FAILED',
      dateFrom: fifteenMinutesAgo,
    }, 1, 10);

    return activities.length;
  }

  private async getAdminEmails(): Promise<string[]> {
    const admins = await prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
        status: 'ACTIVE',
        emailVerified: true,
      },
      select: { email: true },
    });
    return admins.map(admin => admin.email);
  }

  private async getSecurityTeamEmails(): Promise<string[]> {
    const securityTeam = await prisma.user.findMany({
      where: {
        OR: [
          { role: UserRole.ADMIN },
          {
            permissions: {
              some: {
                permission: {
                  code: { contains: 'security' },
                },
              },
            },
          },
        ],
        status: 'ACTIVE',
        emailVerified: true,
      },
      select: { email: true },
    });
    return securityTeam.map(user => user.email);
  }

  // Activity Digest functionality
  async addToDigest(userId: string, activity: any) {
    const userDigest = this.digestSchedule.get(userId) || [];
    userDigest.push(activity);
    this.digestSchedule.set(userId, userDigest);
  }

  private startDigestScheduler() {
    // Send daily digest at 9 AM
    cron.schedule('0 9 * * *', async () => {
      await this.sendActivityDigests();
    });

    // Send weekly summary on Mondays at 9 AM
    cron.schedule('0 9 * * 1', async () => {
      await this.sendWeeklyActivitySummary();
    });
  }

  private async sendActivityDigests() {
    try {
      const users = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          emailVerified: true,
          notificationPreferences: {
            path: '$.activityDigest',
            equals: true,
          },
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      for (const user of users) {
        const digest = this.digestSchedule.get(user.id);
        if (!digest || digest.length === 0) continue;

        await emailService.sendEmail({
          to: user.email,
          subject: 'Your Daily Activity Digest',
          html: this.generateDigestHtml(user, digest),
        });

        // Clear the digest after sending
        this.digestSchedule.delete(user.id);
      }
    } catch (error) {
      logger.error('Failed to send activity digests:', error);
    }
  }

  private async sendWeeklyActivitySummary() {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: UserRole.ADMIN,
          status: 'ACTIVE',
          emailVerified: true,
        },
        select: { email: true },
      });

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const stats = await activityService.getActivityStats({
        dateFrom: weekAgo,
      });

      const htmlContent = this.generateWeeklySummaryHtml(stats);

      await Promise.all(admins.map(admin =>
        emailService.sendEmail({
          to: admin.email,
          subject: 'Weekly Activity Summary',
          html: htmlContent,
        })
      ));
    } catch (error) {
      logger.error('Failed to send weekly activity summary:', error);
    }
  }

  private generateDigestHtml(user: any, activities: any[]): string {
    return `
      <h2>Hello ${user.firstName} ${user.lastName},</h2>
      <p>Here's your daily activity digest:</p>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${activities.map(activity => `
            <tr>
              <td>${new Date(activity.createdAt).toLocaleTimeString()}</td>
              <td>${activity.action}</td>
              <td>${activity.resourceName || activity.path || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p>Total activities: ${activities.length}</p>
    `;
  }

  private generateWeeklySummaryHtml(stats: any): string {
    return `
      <h2>Weekly Activity Summary</h2>
      <h3>Overview</h3>
      <ul>
        <li>Total Activities: ${stats.totalActivities}</li>
        <li>Unique Users: ${stats.uniqueUsers}</li>
        <li>Error Rate: ${stats.errorRate.toFixed(2)}%</li>
        <li>Average Response Time: ${stats.avgResponseTime.toFixed(2)}ms</li>
      </ul>
      <h3>Top Actions</h3>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr>
            <th>Action</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          ${stats.topActions.map((action: any) => `
            <tr>
              <td>${action.action}</td>
              <td>${action.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}

// WebSocket service stub (implement based on your WebSocket setup)
class WebSocketService {
  static async broadcast(recipients: string[], notification: any): Promise<void> {
    // Implementation depends on your WebSocket setup
    // This is a placeholder
    logger.info('WebSocket notification would be sent', { recipients, notification });
  }
}

export const activityNotificationService = ActivityNotificationService.getInstance();