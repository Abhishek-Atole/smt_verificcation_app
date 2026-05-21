import { NextFunction, Response, Request } from 'express';
import { logger } from '../services/logger';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Capture original send
  const originalSend = res.send.bind(res);

  res.send = function (data: any) {
    const duration = Date.now() - startTime;

    logger.http(
      req.method || 'UNKNOWN',
      req.url || '/',
      res.statusCode,
      duration,
      {
        userId: req.userId,
        ipHash: req.ipHash,
      }
    );

    return originalSend(data);
  };

  next();
}
