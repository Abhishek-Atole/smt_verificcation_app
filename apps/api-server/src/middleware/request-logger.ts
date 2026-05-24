import { NextFunction, Response, Request } from 'express';
import { logger } from '../services/logger';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Redact sensitive headers
  const headers = { ...req.headers } as Record<string, any>;
  if (headers.authorization) headers.authorization = '[REDACTED]';
  if (headers.cookie) headers.cookie = '[REDACTED]';

  // Use finish event to capture accurate status code and duration
  res.on('finish', () => {
    try {
      const duration = Date.now() - startTime;
      logger.http(req.method || 'UNKNOWN', req.originalUrl || req.url || '/', res.statusCode, duration, {
        userId: (req as any).userId,
        ipHash: (req as any).ipHash,
        headers,
        contentLength: res.getHeader('Content-Length'),
      });
    } catch (e) {
      logger.error('Failed to log request', e);
    }
  });

  next();
}
