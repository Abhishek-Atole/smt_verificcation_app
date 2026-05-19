import { Router, Request, Response, NextFunction } from 'express';
import { db, schema } from '@smt/db';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { authMiddleware, requireRole } from '../middleware/auth';
import { ValidationError } from '../errors';

const router = Router();

/**
 * Get audit logs for a specific entity
 * GET /api/audit/entity/:entityType/:entityId
 */
router.get(
  '/entity/:entityType/:entityId',
  authMiddleware,
  requireRole('admin', 'supervisor', 'qa'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entityType, entityId } = req.params;
      const limit = parseInt(req.query.limit as string) || 1000;

      const logs = await db
        .select()
        .from(schema.auditLogs)
        .where(
          and(
            eq(schema.auditLogs.entityType, entityType),
            eq(schema.auditLogs.entityId, entityId),
          ),
        )
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(limit);

      res.json({
        data: logs,
        count: logs.length,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Get audit logs for a user as actor
 * GET /api/audit/user/:userId
 */
router.get(
  '/user/:userId',
  authMiddleware,
  requireRole('admin', 'supervisor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 1000;

      const logs = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.userId, userId))
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(limit);

      res.json({
        data: logs,
        count: logs.length,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Get audit logs by action type
 * GET /api/audit/action/:action
 */
router.get(
  '/action/:action',
  authMiddleware,
  requireRole('admin', 'supervisor', 'qa'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { action } = req.params;
      const limit = parseInt(req.query.limit as string) || 1000;

      const logs = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, action as any))
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(limit);

      res.json({
        data: logs,
        count: logs.length,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Get audit logs by date range
 * GET /api/audit/range?startDate=2024-01-01&endDate=2024-01-31
 */
router.get(
  '/range',
  authMiddleware,
  requireRole('admin', 'supervisor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError('Missing required query parameters: startDate, endDate');
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ValidationError('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
      }

      if (start > end) {
        throw new ValidationError('startDate must be before endDate');
      }

      const limit = parseInt(req.query.limit as string) || 5000;

      const logs = await db
        .select()
        .from(schema.auditLogs)
        .where(
          and(
            gte(schema.auditLogs.createdAt, start),
            lte(schema.auditLogs.createdAt, end),
          ),
        )
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(limit);

      res.json({
        data: logs,
        count: logs.length,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Get audit log statistics for last N hours
 * GET /api/audit/stats?hours=24
 */
router.get(
  '/stats',
  authMiddleware,
  requireRole('admin', 'supervisor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;

      if (hours < 1 || hours > 8760) {
        throw new ValidationError('Hours must be between 1 and 8760 (1 year)');
      }

      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

      const records = await db
        .select({
          action: schema.auditLogs.action,
        })
        .from(schema.auditLogs)
        .where(gte(schema.auditLogs.createdAt, cutoff));

      const stats: Record<string, number> = {};
      for (const record of records) {
        stats[record.action] = (stats[record.action] ?? 0) + 1;
      }

      res.json({
        data: stats,
        period: {
          hours,
          startTime: cutoff.toISOString(),
          endTime: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
