import { EventEmitter as NodeEventEmitter } from 'events';
import logger from '../utils/logger';

class EventService extends NodeEventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Increase max listeners to prevent warnings
  }

  emit(event: string, data?: any): boolean {
    logger.debug(`Event emitted: ${event}`, { data });
    return super.emit(event, data);
  }

  on(event: string, listener: (...args: any[]) => void): this {
    logger.debug(`Event listener registered: ${event}`);
    return super.on(event, listener);
  }

  once(event: string, listener: (...args: any[]) => void): this {
    logger.debug(`One-time event listener registered: ${event}`);
    return super.once(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void): this {
    logger.debug(`Event listener removed: ${event}`);
    return super.off(event, listener);
  }

  removeAllListeners(event?: string): this {
    if (event) {
      logger.debug(`All listeners removed for event: ${event}`);
    } else {
      logger.debug('All event listeners removed');
    }
    return super.removeAllListeners(event);
  }
}

export const EventEmitter = new EventService();

// Define event types
export const Events = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_STATUS_CHANGED: 'user.status.changed',
  USER_ROLE_CHANGED: 'user.role.changed',
  USER_PASSWORD_CHANGED: 'user.password.changed',
  USER_LOGGED_IN: 'user.logged.in',
  USER_LOGGED_OUT: 'user.logged.out',
  USER_SESSION_EXPIRED: 'user.session.expired',
  
  // Permission events
  PERMISSION_GRANTED: 'permission.granted',
  PERMISSION_REVOKED: 'permission.revoked',
  PERMISSION_EXPIRED: 'permission.expired',
  
  // Department events
  DEPARTMENT_CREATED: 'department.created',
  DEPARTMENT_UPDATED: 'department.updated',
  DEPARTMENT_DELETED: 'department.deleted',
  
  // Audit events
  AUDIT_LOG_CREATED: 'audit.log.created',
  
  // System events
  CACHE_CLEARED: 'cache.cleared',
  DATABASE_ERROR: 'database.error',
  EMAIL_SENT: 'email.sent',
  EMAIL_FAILED: 'email.failed',
  
  // Import/Export events
  IMPORT_STARTED: 'import.started',
  IMPORT_COMPLETED: 'import.completed',
  IMPORT_FAILED: 'import.failed',
  EXPORT_STARTED: 'export.started',
  EXPORT_COMPLETED: 'export.completed',
  EXPORT_FAILED: 'export.failed',
} as const;

// Type-safe event emitter wrapper
export function emitEvent<T = any>(event: string, data: T): void {
  EventEmitter.emit(event, data);
}

export function onEvent<T = any>(
  event: string,
  handler: (data: T) => void | Promise<void>
): void {
  EventEmitter.on(event, handler);
}

export function onceEvent<T = any>(
  event: string,
  handler: (data: T) => void | Promise<void>
): void {
  EventEmitter.once(event, handler);
}

export function offEvent(
  event: string,
  handler: (...args: any[]) => void
): void {
  EventEmitter.off(event, handler);
}

// Register default event handlers
EventEmitter.on(Events.DATABASE_ERROR, (error) => {
  logger.error('Database error event', error);
});

EventEmitter.on(Events.EMAIL_FAILED, ({ email, error }) => {
  logger.error('Email send failed', { email, error });
});