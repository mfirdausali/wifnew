import { PrismaClient, UserActivityLog } from '@prisma/client';
import { Request } from 'express';
import { redis } from '../config/redis';
import logger from '../utils/logger';
import geoip from 'geoip-lite';
import { EventEmitter } from 'events';

const prisma = new PrismaClient();

export interface ActivityLogData {
  userId: string;
  action: string;
  actionCategory?: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  method?: string;
  path?: string;
  queryParams?: any;
  requestBody?: any;
  responseStatus?: number;
  responseTimeMs?: number;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  details?: any;
  errorMessage?: string;
  stackTrace?: string;
}

export interface ActivityFilter {
  userId?: string;
  action?: string;
  actionCategory?: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  sessionId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  success?: boolean;
}

export interface ActivityStats {
  totalActivities: number;
  uniqueUsers: number;
  topActions: { action: string; count: number }[];
  activityByHour: { hour: number; count: number }[];
  activityByDay: { date: string; count: number }[];
  errorRate: number;
  avgResponseTime: number;
}

class ActivityService extends EventEmitter {
  private static instance: ActivityService;
  private readonly CACHE_PREFIX = 'activity:';
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly BATCH_SIZE = 100;
  private activityQueue: ActivityLogData[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.startBatchProcessor();
  }

  static getInstance(): ActivityService {
    if (!ActivityService.instance) {
      ActivityService.instance = new ActivityService();
    }
    return ActivityService.instance;
  }

  private startBatchProcessor() {
    // Process batch every 5 seconds or when batch is full
    setInterval(() => this.flushBatch(), 5000);
  }

  private async flushBatch() {
    if (this.activityQueue.length === 0) return;

    const batch = this.activityQueue.splice(0, this.BATCH_SIZE);
    
    try {
      await prisma.userActivityLog.createMany({
        data: batch.map(activity => ({
          ...activity,
          createdDate: new Date(),
          ipLocation: activity.ipAddress ? this.getIpLocation(activity.ipAddress) : undefined,
          deviceInfo: activity.userAgent ? this.parseUserAgent(activity.userAgent) : undefined,
        })),
      });

      // Emit events for real-time notifications
      batch.forEach(activity => {
        this.emit('activity', activity);
        
        // Emit specific events for important activities
        if (activity.actionCategory === 'AUTH' && activity.action === 'LOGIN_FAILED') {
          this.emit('security:failed_login', activity);
        }
        
        if (activity.actionCategory === 'PERMISSION' && activity.action.includes('GRANT')) {
          this.emit('security:permission_change', activity);
        }
      });
    } catch (error) {
      logger.error('Failed to flush activity batch:', error);
      // Re-queue failed activities
      this.activityQueue.unshift(...batch);
    }
  }

  async logActivity(data: ActivityLogData): Promise<void> {
    // Add to queue for batch processing
    this.activityQueue.push(data);

    // Flush immediately if batch is full
    if (this.activityQueue.length >= this.BATCH_SIZE) {
      await this.flushBatch();
    }

    // Update real-time stats in Redis
    await this.updateRealtimeStats(data);
  }

  async logHttpActivity(req: Request & { user?: any; sessionId?: string }, res: any, responseTimeMs: number): Promise<void> {
    if (!req.user?.id) return;

    const activity: ActivityLogData = {
      userId: req.user.id,
      action: this.getActionFromRequest(req),
      actionCategory: this.getCategoryFromPath(req.path),
      method: req.method,
      path: req.path,
      queryParams: Object.keys(req.query).length > 0 ? req.query : undefined,
      requestBody: this.sanitizeRequestBody(req.body),
      responseStatus: res.statusCode,
      responseTimeMs,
      ipAddress: this.getClientIp(req),
      userAgent: req.get('user-agent'),
      sessionId: req.sessionId,
      details: {
        headers: this.sanitizeHeaders(req.headers),
      },
    };

    // Add error details if response failed
    if (res.statusCode >= 400) {
      activity.errorMessage = res.statusMessage;
    }

    await this.logActivity(activity);
  }

  private getActionFromRequest(req: Request): string {
    const method = req.method;
    const path = req.path;

    // Auth actions
    if (path.includes('/auth/login')) return 'LOGIN';
    if (path.includes('/auth/logout')) return 'LOGOUT';
    if (path.includes('/auth/refresh')) return 'TOKEN_REFRESH';
    if (path.includes('/auth/password')) return 'PASSWORD_CHANGE';

    // User actions
    if (path.includes('/users')) {
      if (method === 'POST') return 'USER_CREATE';
      if (method === 'PUT' || method === 'PATCH') return 'USER_UPDATE';
      if (method === 'DELETE') return 'USER_DELETE';
      if (method === 'GET') return path.includes('/export') ? 'USER_EXPORT' : 'USER_VIEW';
    }

    // Permission actions
    if (path.includes('/permissions')) {
      if (method === 'POST') return 'PERMISSION_GRANT';
      if (method === 'DELETE') return 'PERMISSION_REVOKE';
      if (method === 'GET') return 'PERMISSION_VIEW';
    }

    // Default action based on method
    return `${method}_${path.split('/').filter(Boolean).join('_').toUpperCase()}`;
  }

  private getCategoryFromPath(path: string): string {
    if (path.includes('/auth')) return 'AUTH';
    if (path.includes('/users')) return 'USER';
    if (path.includes('/permissions')) return 'PERMISSION';
    if (path.includes('/departments')) return 'DEPARTMENT';
    if (path.includes('/admin')) return 'ADMIN';
    if (path.includes('/export') || path.includes('/import')) return 'DATA_TRANSFER';
    return 'OTHER';
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      ''
    );
  }

  private getIpLocation(ip: string): any {
    const geo = geoip.lookup(ip);
    if (!geo) return null;

    return {
      country: geo.country,
      region: geo.region,
      city: geo.city,
      latitude: geo.ll[0],
      longitude: geo.ll[1],
      timezone: geo.timezone,
    };
  }

  private parseUserAgent(userAgent: string): any {
    // Simple user agent parsing - in production, use a library like 'useragent'
    const device = {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown',
      isMobile: false,
    };

    if (userAgent.includes('Chrome')) device.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) device.browser = 'Firefox';
    else if (userAgent.includes('Safari')) device.browser = 'Safari';
    else if (userAgent.includes('Edge')) device.browser = 'Edge';

    if (userAgent.includes('Windows')) device.os = 'Windows';
    else if (userAgent.includes('Mac')) device.os = 'macOS';
    else if (userAgent.includes('Linux')) device.os = 'Linux';
    else if (userAgent.includes('Android')) device.os = 'Android';
    else if (userAgent.includes('iOS')) device.os = 'iOS';

    device.isMobile = /Mobile|Android|iPhone/i.test(userAgent);
    device.device = device.isMobile ? 'Mobile' : 'Desktop';

    return device;
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return undefined;

    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'apiKey', 'creditCard'];
    
    const removeSensitive = (obj: any) => {
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          removeSensitive(obj[key]);
        }
      }
    };

    removeSensitive(sanitized);
    return sanitized;
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private async updateRealtimeStats(activity: ActivityLogData): Promise<void> {
    const now = new Date();
    const hourKey = `${this.CACHE_PREFIX}stats:hour:${now.getHours()}`;
    const dayKey = `${this.CACHE_PREFIX}stats:day:${now.toISOString().split('T')[0]}`;
    const userKey = `${this.CACHE_PREFIX}stats:user:${activity.userId}`;

    try {
      await Promise.all([
        redis.incr(hourKey),
        redis.expire(hourKey, 3600 * 24), // 24 hours
        redis.incr(dayKey),
        redis.expire(dayKey, 3600 * 24 * 7), // 7 days
        redis.hincrby(userKey, 'activity_count', 1),
        redis.expire(userKey, 3600 * 24), // 24 hours
      ]);

      // Track action counts
      if (activity.action) {
        const actionKey = `${this.CACHE_PREFIX}stats:action:${activity.action}`;
        await redis.incr(actionKey);
        await redis.expire(actionKey, 3600 * 24);
      }
    } catch (error) {
      logger.error('Failed to update realtime stats:', error);
    }
  }

  async getActivities(filter: ActivityFilter, page = 1, limit = 50): Promise<{
    activities: UserActivityLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const where: any = {};

    if (filter.userId) where.userId = filter.userId;
    if (filter.action) where.action = filter.action;
    if (filter.actionCategory) where.actionCategory = filter.actionCategory;
    if (filter.resourceType) where.resourceType = filter.resourceType;
    if (filter.resourceId) where.resourceId = filter.resourceId;
    if (filter.ipAddress) where.ipAddress = filter.ipAddress;
    if (filter.sessionId) where.sessionId = filter.sessionId;

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) where.createdAt.gte = filter.dateFrom;
      if (filter.dateTo) where.createdAt.lte = filter.dateTo;
    }

    if (filter.success !== undefined) {
      where.errorMessage = filter.success ? null : { not: null };
    }

    const [activities, total] = await Promise.all([
      prisma.userActivityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userActivityLog.count({ where }),
    ]);

    return {
      activities,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserActivityTimeline(userId: string, days = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await prisma.userActivityLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Group by date
    const timeline = activities.reduce((acc, activity) => {
      const date = activity.createdAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(activity);
      return acc;
    }, {} as Record<string, UserActivityLog[]>);

    return timeline;
  }

  async getActivityStats(filter: ActivityFilter): Promise<ActivityStats> {
    const where: any = {};

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) where.createdAt.gte = filter.dateFrom;
      if (filter.dateTo) where.createdAt.lte = filter.dateTo;
    }

    const [
      totalActivities,
      uniqueUsers,
      topActionsData,
      errorCount,
      responseTimeData,
    ] = await Promise.all([
      prisma.userActivityLog.count({ where }),
      prisma.userActivityLog.groupBy({
        by: ['userId'],
        where,
        _count: true,
      }),
      prisma.userActivityLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      prisma.userActivityLog.count({
        where: { ...where, errorMessage: { not: null } },
      }),
      prisma.userActivityLog.aggregate({
        where: { ...where, responseTimeMs: { not: null } },
        _avg: { responseTimeMs: true },
      }),
    ]);

    // Get activity by hour (last 24 hours)
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const hourlyActivity = await prisma.$queryRaw<{ hour: number; count: bigint }[]>`
      SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
      FROM user_activity_logs
      WHERE created_at >= ${last24Hours}
      GROUP BY hour
      ORDER BY hour
    `;

    // Get activity by day (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const dailyActivity = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM user_activity_logs
      WHERE created_at >= ${last7Days}
      GROUP BY date
      ORDER BY date
    `;

    return {
      totalActivities,
      uniqueUsers: uniqueUsers.length,
      topActions: topActionsData.map(item => ({
        action: item.action,
        count: item._count.action,
      })),
      activityByHour: hourlyActivity.map(item => ({
        hour: Number(item.hour),
        count: Number(item.count),
      })),
      activityByDay: dailyActivity.map(item => ({
        date: item.date.toISOString().split('T')[0],
        count: Number(item.count),
      })),
      errorRate: totalActivities > 0 ? (errorCount / totalActivities) * 100 : 0,
      avgResponseTime: responseTimeData._avg.responseTimeMs || 0,
    };
  }

  async detectSuspiciousActivity(userId: string): Promise<{
    suspicious: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    const last15Minutes = new Date();
    last15Minutes.setMinutes(last15Minutes.getMinutes() - 15);

    // Check for multiple failed login attempts
    const failedLogins = await prisma.userActivityLog.count({
      where: {
        userId,
        action: 'LOGIN_FAILED',
        createdAt: { gte: last15Minutes },
      },
    });

    if (failedLogins >= 3) {
      reasons.push(`${failedLogins} failed login attempts in the last 15 minutes`);
    }

    // Check for unusual activity pattern
    const recentActivities = await prisma.userActivityLog.findMany({
      where: {
        userId,
        createdAt: { gte: last15Minutes },
      },
      select: { ipAddress: true, userAgent: true },
    });

    const uniqueIps = new Set(recentActivities.map(a => a.ipAddress)).size;
    const uniqueAgents = new Set(recentActivities.map(a => a.userAgent)).size;

    if (uniqueIps > 3) {
      reasons.push(`Activity from ${uniqueIps} different IP addresses`);
    }

    if (uniqueAgents > 3) {
      reasons.push(`Activity from ${uniqueAgents} different devices`);
    }

    // Check for high-risk actions
    const highRiskActions = await prisma.userActivityLog.count({
      where: {
        userId,
        action: {
          in: ['PERMISSION_GRANT', 'USER_DELETE', 'BULK_DELETE', 'EXPORT_ALL'],
        },
        createdAt: { gte: last15Minutes },
      },
    });

    if (highRiskActions > 5) {
      reasons.push(`${highRiskActions} high-risk actions performed`);
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  }

  async createActivityReport(userId: string, startDate: Date, endDate: Date): Promise<any> {
    const activities = await prisma.userActivityLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = await this.getActivityStats({
      userId,
      dateFrom: startDate,
      dateTo: endDate,
    });

    const report = {
      userId,
      period: {
        from: startDate,
        to: endDate,
      },
      summary: stats,
      activities: activities.map(activity => ({
        ...activity,
        ipLocation: undefined, // Remove detailed location from report
        deviceInfo: activity.deviceInfo ? {
          browser: (activity.deviceInfo as any).browser,
          os: (activity.deviceInfo as any).os,
          device: (activity.deviceInfo as any).device,
        } : undefined,
      })),
      generatedAt: new Date(),
    };

    return report;
  }

  async cleanupOldActivities(retentionDays = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.userActivityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    logger.info(`Cleaned up ${result.count} old activity logs`);
    return result.count;
  }
}

export const activityService = ActivityService.getInstance();