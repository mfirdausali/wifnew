import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body, query, param } from 'express-validator';
import { highRiskOperationLogger } from '../middleware/activity.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get activity metadata (categories, actions, etc.)
router.get('/metadata', ActivityController.getActivityMetadata);

// Get current user's activities
router.get('/my-activities', 
  validateRequest([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('action').optional().isString(),
    query('actionCategory').optional().isString(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
  ]),
  ActivityController.getMyActivities
);

// Get all activities (admin only)
router.get('/',
  authorize('activity.view.all'),
  validateRequest([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('userId').optional().isUUID(),
    query('action').optional().isString(),
    query('actionCategory').optional().isString(),
    query('resourceType').optional().isString(),
    query('resourceId').optional().isString(),
    query('ipAddress').optional().isIP(),
    query('sessionId').optional().isString(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('success').optional().isBoolean(),
  ]),
  ActivityController.getActivities
);

// Get activity statistics
router.get('/stats',
  authorize('activity.stats.view'),
  validateRequest([
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('userId').optional().isUUID(),
  ]),
  ActivityController.getActivityStats
);

// Get real-time activity feed
router.get('/feed',
  authorize('activity.feed.view'),
  validateRequest([
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ]),
  ActivityController.getActivityFeed
);

// Export activities
router.get('/export',
  authorize('activity.export'),
  highRiskOperationLogger('ACTIVITY_EXPORT'),
  validateRequest([
    query('format').optional().isIn(['csv', 'json']),
    query('userId').optional().isUUID(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('actionCategory').optional().isString(),
  ]),
  ActivityController.exportActivities
);

// Get user activity timeline
router.get('/users/:userId/timeline',
  validateRequest([
    param('userId').isUUID(),
    query('days').optional().isInt({ min: 1, max: 365 }),
  ]),
  ActivityController.getUserActivityTimeline
);

// Check suspicious activity for a user
router.get('/users/:userId/suspicious',
  authorize('security.suspicious.check'),
  validateRequest([
    param('userId').isUUID(),
  ]),
  ActivityController.checkSuspiciousActivity
);

// Generate activity report for a user
router.post('/users/:userId/report',
  validateRequest([
    param('userId').isUUID(),
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
  ]),
  ActivityController.generateActivityReport
);

export default router;