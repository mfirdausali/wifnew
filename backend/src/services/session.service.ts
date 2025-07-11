import { prisma } from '../config/database';
import { UserSession } from '@prisma/client';
import crypto from 'crypto';
import { addHours } from 'date-fns';
import logger from '../utils/logger';

export class SessionService {
  static async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    expiresInHours = 24
  ): Promise<UserSession> {
    const sessionToken = this.generateSessionToken();
    const expiresAt = addHours(new Date(), expiresInHours);

    const session = await prisma.userSession.create({
      data: {
        userId,
        sessionToken,
        ipAddress,
        userAgent,
        expiresAt,
        lastActivityAt: new Date(),
      },
    });

    logger.info('Session created', { userId, sessionId: session.id });

    return session;
  }

  static async validateSession(sessionToken: string): Promise<UserSession | null> {
    const session = await prisma.userSession.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await this.revokeSession(session.id);
      return null;
    }

    // Check if session is revoked
    if (session.revokedAt) {
      return null;
    }

    // Update last activity
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    return session;
  }

  static async revokeSession(sessionId: string, revokedBy?: string): Promise<void> {
    await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
        revokedBy,
      },
    });

    logger.info('Session revoked', { sessionId, revokedBy });
  }

  static async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const whereClause: any = {
      userId,
      revokedAt: null,
    };

    if (exceptSessionId) {
      whereClause.id = { not: exceptSessionId };
    }

    const result = await prisma.userSession.updateMany({
      where: whereClause,
      data: {
        revokedAt: new Date(),
      },
    });

    logger.info('All user sessions revoked', { userId, count: result.count });
  }

  static async getActiveSessions(userId: string): Promise<UserSession[]> {
    return await prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  static async getSessionCount(userId: string): Promise<number> {
    return await prisma.userSession.count({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  static async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            revokedAt: { not: null },
            revokedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 30 days old
          },
        ],
      },
    });

    logger.info('Expired sessions cleaned up', { count: result.count });

    return result.count;
  }

  static async extendSession(sessionId: string, additionalHours = 24): Promise<UserSession> {
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new Error('Session invalid or expired');
    }

    const newExpiresAt = addHours(new Date(), additionalHours);

    return await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        expiresAt: newExpiresAt,
        lastActivityAt: new Date(),
      },
    });
  }

  static async getSessionInfo(sessionToken: string) {
    const session = await prisma.userSession.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      userId: session.userId,
      user: session.user,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      isExpired: session.expiresAt < new Date(),
      isRevoked: !!session.revokedAt,
    };
  }

  static async getAllActiveSessions() {
    return await prisma.userSession.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  static async getSessionsByIpAddress(ipAddress: string) {
    return await prisma.userSession.findMany({
      where: {
        ipAddress,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  private static generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}