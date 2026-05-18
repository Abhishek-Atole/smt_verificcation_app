import { Response } from 'express';
import { env } from '@smt/config';
import { AppError, InternalError } from '../errors';
import { ErrorResponse, Request } from '@smt/api-types';

export function errorHandler(
  error: Error,
  _req: Request & any,
  res: Response
): void {
  console.error('Error:', error);

  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.code,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
    };

    res.status(error.statusCode).json(response);
    return;
  }

  // Hide stack traces in production
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : error.message;
  const appError = new InternalError(message);

  const response: ErrorResponse = {
    error: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
    timestamp: new Date().toISOString(),
  };

  res.status(500).json(response);
}

export function notFoundHandler(_req: Request & any, res: Response): void {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint not found',
    statusCode: 404,
    timestamp: new Date().toISOString(),
  });
}
