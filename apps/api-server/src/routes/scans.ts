import { Router, Request, Response, NextFunction } from 'express';
import { db, schema } from '@smt/db';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, requireRole } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../errors';

const router = Router();

/**
 * Record a scan for a session
 * POST /api/scans/record
 * Body: { sessionId, feederSlot, scannedValue }
 */
router.post(
  '/record',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, feederSlot, scannedValue } = req.body;

      if (!sessionId || !feederSlot || !scannedValue) {
        throw new ValidationError('Missing required fields: sessionId, feederSlot, scannedValue');
      }

      // Verify session exists
      const session = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, sessionId))
        .limit(1);

      if (!session.length) {
        throw new NotFoundError('Session not found');
      }

      // Verify feeder exists in BOM
      const bomId = session[0].bomId;
      const feeder = await db
        .select()
        .from(schema.bomItems)
        .where(
          and(
            eq(schema.bomItems.bomId, bomId),
            eq(schema.bomItems.feederSlot, feederSlot),
          ),
        )
        .limit(1);

      if (!feeder.length) {
        throw new NotFoundError('Feeder slot not found in BOM');
      }

      // Create scan record
      const scan = await db
        .insert(schema.scans)
        .values({
          sessionId,
          feederSlot,
          scannedValue,
          validationResult: 'error',
          timestamp: new Date(),
        })
        .returning();

      // Broadcast scan recorded event if io is available
      const io = req.app.get('io');
      if (io) {
        io.to(`session:${sessionId}`).emit('scan:recorded', {
          scanId: scan[0].id,
          feederSlot,
          timestamp: scan[0].timestamp,
        });
      }

      res.status(201).json({ data: scan[0] });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Get scan statistics for a session
 * GET /api/scans/session/:sessionId/stats
 */
router.get(
  '/session/:sessionId/stats',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;

      // Verify session exists
      const session = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, sessionId))
        .limit(1);

      if (!session.length) {
        throw new NotFoundError('Session not found');
      }

      // Get scan statistics
      const scans = await db
        .select()
        .from(schema.scans)
        .where(eq(schema.scans.sessionId, sessionId));

      const stats = {
        total: scans.length,
        passed: scans.filter((s) => s.validationResult === 'pass').length,
        alternate: scans.filter((s) => s.validationResult === 'alternate').length,
        manual: scans.filter((s) => s.validationResult === 'manual').length,
        failed: scans.filter((s) => s.validationResult === 'fail').length,
        freeScan: scans.filter((s) => s.validationResult === 'free_scan').length,
        error: scans.filter((s) => s.validationResult === 'error').length,
      };

      res.json({ data: stats });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Get quick scan counts for a session
 * GET /api/scans/session/:sessionId/quick-stats
 */
router.get(
  '/session/:sessionId/quick-stats',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;

      const scans = await db
        .select()
        .from(schema.scans)
        .where(eq(schema.scans.sessionId, sessionId));

      const passed = scans.filter((s) => s.validationResult === 'pass').length;
      const failed = scans.filter((s) => s.validationResult === 'fail').length;

      res.json({
        data: {
          total: scans.length,
          passed,
          failed,
          fpy: passed + failed > 0 ? (passed / (passed + failed)) * 100 : 0,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Get session timing information
 * GET /api/scans/session/:sessionId/duration
 */
router.get(
  '/session/:sessionId/duration',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;

      const session = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, sessionId))
        .limit(1);

      if (!session.length) {
        throw new NotFoundError('Session not found');
      }

      const s = session[0];
      const startTime = s.createdAt.getTime();
      const endTime = s.updatedAt.getTime();
      const duration = Math.round((endTime - startTime) / 1000); // seconds

      res.json({
        data: {
          sessionId: s.sessionId,
          startTime: s.createdAt.toISOString(),
          endTime: s.updatedAt.toISOString(),
          durationSeconds: duration,
          status: s.status,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Get summary for multiple sessions
 * POST /api/scans/summary
 * Body: { sessionIds: string[] }
 */
router.post(
  '/summary',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionIds } = req.body;

      if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
        throw new ValidationError('sessionIds must be a non-empty array');
      }

      const summary: Record<
        string,
        {
          total: number;
          passed: number;
          failed: number;
          fpy: number;
        }
      > = {};

      for (const sessionId of sessionIds) {
        const scans = await db
          .select()
          .from(schema.scans)
          .where(eq(schema.scans.sessionId, sessionId));

        const passed = scans.filter((s) => s.validationResult === 'pass').length;
        const failed = scans.filter((s) => s.validationResult === 'fail').length;
        const total = passed + failed;

        summary[sessionId] = {
          total,
          passed,
          failed,
          fpy: total > 0 ? (passed / total) * 100 : 0,
        };
      }

      res.json({ data: summary });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Override a scan result (Admin/QA only)
 * PATCH /api/scans/:scanId/override
 * Body: { newResult, reason }
 */
router.patch(
  '/:scanId/override',
  authMiddleware,
  requireRole('admin', 'qa'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { scanId } = req.params;
      const { newResult, reason } = req.body;

      if (!newResult || !reason) {
        throw new ValidationError('Missing required fields: newResult, reason');
      }

      const validResults = ['pass', 'fail', 'alternate', 'manual', 'free_scan'];
      if (!validResults.includes(newResult)) {
        throw new ValidationError(`Invalid validation result: ${newResult}`);
      }

      // Get scan
      const scans = await db
        .select()
        .from(schema.scans)
        .where(eq(schema.scans.id, scanId))
        .limit(1);

      if (!scans.length) {
        throw new NotFoundError('Scan not found');
      }

      // Update scan
      const updated = await db
        .update(schema.scans)
        .set({
          validationResult: newResult as any,
        })
        .where(eq(schema.scans.id, scanId))
        .returning();

      // Broadcast override event
      const io = req.app.get('io');
      if (io) {
        io.to(`role:admin`).emit('scan:overridden', {
          scanId,
          newResult,
          reason,
          overriddenBy: req.userId!,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({ data: updated[0] });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
