import { Request, Response, NextFunction } from 'express';
import CacheService from '../services/cache.service';
import logger from '../utils/logger';

interface CacheOptions {
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
  ttl?: number;
}

export function cache(prefix: string, ttl: number = 300, options?: CacheOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check condition if provided
    if (options?.condition && !options.condition(req)) {
      return next();
    }

    // Generate cache key
    const key = options?.keyGenerator 
      ? options.keyGenerator(req)
      : generateCacheKey(prefix, req);

    try {
      // Try to get from cache
      const cached = await CacheService.get(key);
      
      if (cached) {
        logger.debug('Cache hit', { key });
        
        // Set cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', key);
        
        return res.json(cached);
      }

      logger.debug('Cache miss', { key });
      
      // Store original json method
      const originalJson = res.json.bind(res);
      
      // Override json method to cache the response
      res.json = function(data: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          CacheService.set(key, data, options?.ttl || ttl).catch(error => {
            logger.error('Failed to cache response', { key, error });
          });
        }
        
        // Set cache headers
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', key);
        
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { key, error });
      next();
    }
  };
}

function generateCacheKey(prefix: string, req: Request): string {
  const userId = (req as any).user?.id || 'anonymous';
  const path = req.path;
  const query = JSON.stringify(req.query);
  
  return `${prefix}:${userId}:${path}:${query}`;
}

// Middleware to clear cache based on patterns
export function clearCache(patterns: string[]) {
  return async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      for (const pattern of patterns) {
        await CacheService.invalidatePattern(pattern);
      }
      next();
    } catch (error) {
      logger.error('Clear cache middleware error', { patterns, error });
      next();
    }
  };
}

// Middleware to add cache control headers
export function cacheControl(options: {
  public?: boolean;
  private?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  maxAge?: number;
  sMaxAge?: number;
}) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const directives: string[] = [];

    if (options.public) directives.push('public');
    if (options.private) directives.push('private');
    if (options.noCache) directives.push('no-cache');
    if (options.noStore) directives.push('no-store');
    if (options.mustRevalidate) directives.push('must-revalidate');
    if (options.maxAge !== undefined) directives.push(`max-age=${options.maxAge}`);
    if (options.sMaxAge !== undefined) directives.push(`s-maxage=${options.sMaxAge}`);

    if (directives.length > 0) {
      res.setHeader('Cache-Control', directives.join(', '));
    }

    next();
  };
}

// Helper to create cache keys for specific entities
export class CacheKeys {
  static userList(filters: any): string {
    return `users-list:${JSON.stringify(filters)}`;
  }

  static userDetail(userId: string): string {
    return `user:${userId}`;
  }

  static userPermissions(userId: string): string {
    return `user-permissions:${userId}`;
  }

  static departmentUsers(departmentId: string): string {
    return `department-users:${departmentId}`;
  }

  static roleUsers(role: string): string {
    return `role-users:${role}`;
  }
}