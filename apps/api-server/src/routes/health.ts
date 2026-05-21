import { Router, Response } from 'express';
import { optionalAuthMiddleware } from '../middleware/auth';
import { getCurrentTimestamp } from '../utils';
import { checkDatabaseConnection } from '@smt/db';
import { HealthResponse, Request } from '@smt/api-types';

export const healthRouter = Router();

healthRouter.get('/', optionalAuthMiddleware, async (_req: Request & any, res: Response) => {
  try {
    const uptime = process.uptime();
    
    // Check actual database connection
    const dbConnected = await checkDatabaseConnection();

    const response: HealthResponse = {
      status: dbConnected ? 'ok' : 'degraded',
      timestamp: getCurrentTimestamp(),
      database: dbConnected ? 'connected' : 'disconnected',
      uptime: Math.floor(uptime),
    };

    const statusCode = dbConnected ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: getCurrentTimestamp(),
      database: 'disconnected',
      uptime: Math.floor(process.uptime()),
    });
  }
});
