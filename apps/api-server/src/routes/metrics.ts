import { Router, Request, Response, NextFunction } from 'express';
import * as metricsRepo from '../repositories/metrics';
import { authMiddleware, requireRole } from '../middleware/auth';
import { ValidationError } from '../errors';

const router = Router();

// Get daily metrics
router.get(
  '/daily/:date',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date } = req.params;

      // Validate date format YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new ValidationError('Date must be in format YYYY-MM-DD');
      }

      const metrics = await metricsRepo.getMetricsForDate(date);

      res.json({
        data: metrics,
        date,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Get metrics for date range
router.get(
  '/range',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError('startDate and endDate are required');
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate as string)) {
        throw new ValidationError('startDate must be in format YYYY-MM-DD');
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate as string)) {
        throw new ValidationError('endDate must be in format YYYY-MM-DD');
      }

      const metrics = await metricsRepo.getMetricsDateRange(
        startDate as string,
        endDate as string
      );

      res.json({
        data: metrics,
        startDate,
        endDate,
        count: metrics.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Update metrics (admin only)
router.put(
  '/daily/:date',
  authMiddleware,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date } = req.params;
      const {
        firstPassYield,
        feedersPerMinute,
        averageCycleTime,
        oeeScore,
        availability,
        performance,
        quality,
      } = req.body;

      if (
        !firstPassYield ||
        !feedersPerMinute ||
        !averageCycleTime ||
        !oeeScore ||
        !availability ||
        !performance ||
        !quality
      ) {
        throw new ValidationError('All metrics fields are required');
      }

      const result = await metricsRepo.updateMetrics({
        date,
        firstPassYield,
        feedersPerMinute,
        averageCycleTime,
        oeeScore,
        availability,
        performance,
        quality,
      });

      const io = req.app.get('io');
      if (io) {
        io.to('role:admin').emit('metrics:updated', {
          date,
          metrics: result[0],
          timestamp: new Date().toISOString(),
        });
      }

      res.json({ data: result[0] });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
