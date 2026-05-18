import { Router, Response } from 'express';
import { optionalAuthMiddleware } from '../middleware/auth';
import { getCurrentTimestamp } from '../utils';
import { HealthResponse, Request } from '@smt/api-types';

export const healthRouter = Router();

healthRouter.get('/health', optionalAuthMiddleware, async (_req: Request & any, res: Response) => {
  try {
    const uptime = process.uptime();

    const response: HealthResponse = {
      status: 'ok',
      timestamp: getCurrentTimestamp(),
      database: 'connected', // TODO: Check actual DB connection
      uptime: Math.floor(uptime),
    };

    res.status(200).json(response);
  } catch {
    res.status(500).json({
      status: 'error',
      timestamp: getCurrentTimestamp(),
      database: 'disconnected',
      uptime: Math.floor(process.uptime()),
    });
  }
});
