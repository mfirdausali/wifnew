import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { User } from '@prisma/client';
import { env } from '@config/env';
import { prisma } from '@config/database';
import { redis } from '@config/redis';
import { UnauthorizedError } from '@utils/errors';
import { TOKEN_TYPES, REDIS_KEYS } from '@utils/constants';
import { generateRandomString } from '@utils/helpers';
import logger from '@utils/logger';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: string;
  sessionId?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class TokenService {
  private static generateToken(
    payload: object,
    expiresIn: string | number,
    secret: string = env.JWT_SECRET
  ): string {
    return jwt.sign(payload, secret, { expiresIn } as SignOptions);
  }

  static async generateTokenPair(user: User): Promise<TokenPair> {
    const sessionId = generateRandomString(16);
    
    const accessTokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: TOKEN_TYPES.ACCESS,
      sessionId,
    };

    const refreshTokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: TOKEN_TYPES.REFRESH,
      sessionId,
    };

    const accessToken = this.generateToken(
      accessTokenPayload,
      env.JWT_ACCESS_EXPIRY
    );

    const refreshToken = this.generateToken(
      refreshTokenPayload,
      env.JWT_REFRESH_EXPIRY
    );

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Store session in Redis
    await redis.setex(
      REDIS_KEYS.USER_SESSION(user.id),
      7 * 24 * 60 * 60, // 7 days in seconds
      JSON.stringify({ sessionId, refreshToken })
    );

    logger.info('Token pair generated', { userId: user.id, sessionId });

    return { accessToken, refreshToken };
  }

  static async verifyToken(token: string, type: string = TOKEN_TYPES.ACCESS): Promise<TokenPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await redis.get(REDIS_KEYS.BLACKLIST_TOKEN(token));
      if (isBlacklisted) {
        throw new UnauthorizedError('Token has been revoked');
      }

      const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

      if (payload.type !== type) {
        throw new UnauthorizedError('Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw error;
    }
  }

  static async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyToken(refreshToken, TOKEN_TYPES.REFRESH);

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new token pair
    const newTokens = await this.generateTokenPair(storedToken.user);

    logger.info('Tokens refreshed', { userId: storedToken.user.id });

    return newTokens;
  }

  static async revokeToken(token: string): Promise<void> {
    const payload = await this.verifyToken(token);

    // Add token to blacklist in Redis
    const ttl = Math.floor((jwt.decode(token) as any).exp - Date.now() / 1000);
    if (ttl > 0) {
      await redis.setex(REDIS_KEYS.BLACKLIST_TOKEN(token), ttl, '1');
    }

    // If it's a refresh token, mark it as revoked in database
    if (payload.type === TOKEN_TYPES.REFRESH) {
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { revokedAt: new Date() },
      });
    }

    // Remove user session from Redis
    await redis.del(REDIS_KEYS.USER_SESSION(payload.userId));

    logger.info('Token revoked', { userId: payload.userId });
  }

  static async revokeAllUserTokens(userId: string): Promise<void> {
    // Revoke all refresh tokens for the user
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Remove user session from Redis
    await redis.del(REDIS_KEYS.USER_SESSION(userId));

    logger.info('All user tokens revoked', { userId });
  }

  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }
}