import { Router, Request, Response, NextFunction } from 'express';
import * as sessionRepo from '../repositories/sessions';
import { authMiddleware, requireRole } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../errors';

const router = Router();

// List sessions with filters
router.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bomId = req.query.bomId as string | undefined;
      const operator = req.query.operator as string | undefined;
      const status = req.query.status as string | undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const sessions = await sessionRepo.listSessions(bomId, operator, status, limit, offset);

      res.json({
        data: sessions,
        limit,
        offset,
        total: sessions.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Get session by ID with scans
router.get(
  '/:sessionId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await sessionRepo.getSessionById(req.params.sessionId);
      if (!session) {
        throw new NotFoundError('Session not found');
      }

      const scans = await sessionRepo.getScans(req.params.sessionId);

      res.json({
        data: {
          ...session,
          scans,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// Create new session
router.post(
  '/',
  authMiddleware,
  requireRole('supervisor', 'operator'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bomId } = req.body;

      if (!bomId) {
        throw new ValidationError('bomId is required');
      }

      const session = await sessionRepo.createSession({
        bomId,
        operator: req.userId!,
        status: 'active',
      });

      // Broadcast to admin room
      const io = req.app.get('io');
      if (io) {
        io.to('role:admin').emit('session:created', {
          sessionId: session.id,
          bomId: session.bomId,
          operator: session.operator,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(201).json({ data: session });
    } catch (err) {
      next(err);
    }
  }
);

// Pause session
router.patch(
  '/:sessionId/pause',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await sessionRepo.getSessionById(req.params.sessionId);
      if (!session) {
        throw new NotFoundError('Session not found');
      }

      const updated = await sessionRepo.updateSession(req.params.sessionId, {
        status: 'paused',
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`session:${req.params.sessionId}`).emit('session:paused', {
          sessionId: req.params.sessionId,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// Resume session
router.patch(
  '/:sessionId/resume',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await sessionRepo.getSessionById(req.params.sessionId);
      if (!session) {
        throw new NotFoundError('Session not found');
      }

      const updated = await sessionRepo.updateSession(req.params.sessionId, {
        status: 'active',
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`session:${req.params.sessionId}`).emit('session:resumed', {
          sessionId: req.params.sessionId,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// Complete session
router.patch(
  '/:sessionId/complete',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await sessionRepo.getSessionById(req.params.sessionId);
      if (!session) {
        throw new NotFoundError('Session not found');
      }

      const updated = await sessionRepo.updateSession(req.params.sessionId, {
        status: 'completed',
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`session:${req.params.sessionId}`).emit('session:completed', {
          sessionId: req.params.sessionId,
          totalScans: updated?.totalScans,
          passCount: updated?.passCount,
          failCount: updated?.failCount,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// Cancel session
router.patch(
  '/:sessionId/cancel',
  authMiddleware,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await sessionRepo.getSessionById(req.params.sessionId);
      if (!session) {
        throw new NotFoundError('Session not found');
      }

      const updated = await sessionRepo.updateSession(req.params.sessionId, {
        status: 'cancelled',
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`session:${req.params.sessionId}`).emit('session:cancelled', {
          sessionId: req.params.sessionId,
          reason: req.body.reason || 'Cancelled by admin',
          timestamp: new Date().toISOString(),
        });
      }

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// Record scan result
router.post(
  '/:sessionId/scans',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { scannedValue, feederSlot, internalPartNumber } = req.body;

      if (!scannedValue) {
        throw new ValidationError('scannedValue is required');
      }

      const scan = await sessionRepo.recordScan({
        sessionId: req.params.sessionId,
        scannedValue,
        validationResult: 'pending',
        feederSlot,
        internalPartNumber,
      });

      // Broadcast scan event
      const io = req.app.get('io');
      if (io) {
        io.to(`session:${req.params.sessionId}`).emit('scan:recorded', {
          scanId: scan.id,
          scannedValue,
          timestamp: scan.timestamp,
        });
      }

      res.status(201).json({ data: scan });
    } catch (err) {
      next(err);
    }
  }
);

// Get scans for session
router.get(
  '/:sessionId/scans',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
      const offset = parseInt(req.query.offset as string) || 0;

      const scans = await sessionRepo.getScans(req.params.sessionId, limit, offset);

      res.json({
        data: scans,
        limit,
        offset,
        total: scans.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
