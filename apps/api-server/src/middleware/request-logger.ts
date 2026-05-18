import { NextFunction, Response } from 'express';
import { Request } from '@smt/api-types';
import { getCurrentTimestamp } from '../utils';

interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  statusCode?: number;
  duration: number;
  userId?: string;
  ipHash?: string;
}

export function requestLoggerMiddleware(req: Request & any, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Capture original send
  const originalSend = res.send.bind(res);

  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    const log: RequestLog = {
      timestamp: getCurrentTimestamp(),
      method: req.method || 'UNKNOWN',
      url: req.url || '/',
      statusCode: res.statusCode,
      duration,
      userId: req.userId,
      ipHash: req.ipHash,
    };

    // Log in structured format
    if (res.statusCode >= 400) {
      console.error('Request failed:', JSON.stringify(log));
    } else {
      console.log('Request:', JSON.stringify(log));
    }

    return originalSend(data);
  };

  next();
}
