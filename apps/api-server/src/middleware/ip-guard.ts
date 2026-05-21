import { NextFunction, Response, Request } from 'express';
import { env } from '@smt/config';
import { ForbiddenError } from '../errors';
import { hashIP, extractIPAddress } from '../utils';

// In-memory allowlist (in production, would reload from DB periodically)
const allowedIPs = new Set<string>();

export function initIPAllowlist(ips: string[]): void {
  allowedIPs.clear();

  for (const ip of ips) {
    const hashed = hashIP(ip);
    allowedIPs.add(hashed);
  }
}

export function reloadIPAllowlist(ips: string[]): void {
  initIPAllowlist(ips);
}

export function ipGuardMiddleware(req: Request & any, _res: Response, next: NextFunction): void {
  try {
    // Skip check for local development if admin allowlist is default
    if (env.NODE_ENV === 'development' && env.ADMIN_IP_ALLOWLIST === '127.0.0.1') {
      next();
      return;
    }

    const rawIP = extractIPAddress(req.headers || {});
    const hashedIP = hashIP(rawIP);

    req.ipHash = hashedIP;

    // Only enforce for admin endpoints (check for admin role or specific routes)
    if (req.userRole === 'admin' || req.path?.startsWith('/api/admin')) {
      if (!allowedIPs.has(hashedIP)) {
        throw new ForbiddenError('IP address not in allowlist');
      }
    }

    next();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      next(error);
    } else if (error instanceof Error) {
      next(error);
    } else {
      next(new Error('IP guard check failed'));
    }
  }
}

// Initialize with configured allowlist
const ips = env.ADMIN_IP_ALLOWLIST.split(',').map((ip: string) => ip.trim());
initIPAllowlist(ips);
