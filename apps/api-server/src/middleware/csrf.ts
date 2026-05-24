import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '@smt/config';
import { logger } from '../services/logger';

/**
 * CSRF Protection Middleware
 * Generates CSRF tokens for safe storage and validates them on state-changing requests
 * Works alongside HttpOnly cookies with SameSite=strict for defense in depth
 */

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = '_csrf';

/**
 * Generate a CSRF token by signing random data with the JWT secret
 */
function generateCsrfToken(): string {
  const randomBytes = crypto.randomBytes(32);
  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(randomBytes)
    .digest('hex');
  return `${randomBytes.toString('hex')}.${signature}`;
}

/**
 * Verify a CSRF token
 */
function verifyCsrfToken(token: string): boolean {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return false;

    const buffer = Buffer.from(data, 'hex');
    const expectedSignature = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(buffer)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

/**
 * CSRF protection middleware
 * - GET requests: generate and send token in response header
 * - POST/PUT/DELETE/PATCH: validate token from request header
 * - Skips protected endpoints that use HttpOnly cookies (Socket.IO)
 */
export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip Socket.IO upgrade requests
  if (req.url.includes('socket.io')) {
    next();
    return;
  }

  // For safe methods (GET, HEAD, OPTIONS), generate and send token
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const token = generateCsrfToken();
    res.setHeader(CSRF_HEADER, token);
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // Client-side JavaScript needs to read this
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    logger.debug('CSRF: issued token for safe method', { method: req.method, url: req.url });
    next();
    return;
  }

  // For state-changing methods (POST, PUT, DELETE, PATCH), validate token
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers[CSRF_HEADER] as string | undefined;

    // Development convenience: when origin is missing/null (file:// / Electron) or from localhost,
    // skip strict CSRF enforcement to avoid blocking local dev flows. Do NOT enable in production.
    const originHeader = (req.headers.origin || '') as string;
    const isDevRelax = env.NODE_ENV !== 'production' && (!originHeader || originHeader === 'null' || originHeader.startsWith('http://localhost'));

    if (!token) {
      logger.warn('CSRF: token missing', { url: req.url, method: req.method, origin: req.headers.origin });
      if (isDevRelax) {
        logger.debug('CSRF: relaxed in development for missing token', { origin: req.headers.origin });
        next();
        return;
      }

      res.status(403).json({
        error: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token is required for this operation',
      });
      return;
    }

    if (!verifyCsrfToken(token)) {
      logger.warn('CSRF: invalid token', { url: req.url, origin: req.headers.origin });
      if (isDevRelax) {
        logger.debug('CSRF: relaxed in development for invalid token', { origin: req.headers.origin });
        next();
        return;
      }

      res.status(403).json({
        error: 'CSRF_TOKEN_INVALID',
        message: 'Invalid or expired CSRF token',
      });
      return;
    }

    logger.debug('CSRF: token validated', { url: req.url, method: req.method });

    next();
    return;
  }

  next();
}

export default csrfMiddleware;
