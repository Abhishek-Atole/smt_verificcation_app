import { Router } from 'express';
import { getRecentLogs } from '../services/logger';
import jwt from 'jsonwebtoken';
import { env } from '@smt/config';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Return recent application logs (JSON lines)
// Return recent application logs (JSON lines) - ADMIN only
router.get('/logs', authMiddleware, requireRole('admin'), (_req, res) => {
  const lines = Math.min(parseInt((_req.query.lines as string) || '200', 10), 2000);
  const logs = getRecentLogs(lines);
  // parse JSON lines into objects, but treat parse failures as raw strings
  const parsed = logs.map((l) => {
    try { return JSON.parse(l); } catch { return { raw: l }; }
  });
  res.json({ data: parsed });
});

// Issue a short-lived socket JWT to an authenticated user.
// This endpoint requires an authenticated session (cookie) and a valid CSRF token.
// The returned token is intended only for Socket.IO handshake auth and expires quickly.
router.post('/socket-token', authMiddleware, (_req, res) => {
  // Create a very short-lived token (60 seconds) with explicit socket scope
  const userId = (_req as any).userId || 'unknown';
  const role = (_req as any).userRole || 'user';

  const payload = {
    sub: userId,
    userId,
    email: (_req as any).userEmail || 'unknown',
    role,
    // Audience and issuer for stricter validation
    aud: 'socket',
    iss: (env as any).APP_NAME || 'api-server',
    // allowedRooms: pre-calculate rooms the client may join (user & role)
    allowedRooms: [`user:${userId}`, `role:${role}`],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60, // 1 minute
  } as any;

  const token = jwt.sign(payload, env.JWT_SECRET, { algorithm: env.JWT_ALGORITHM as any });

  res.json({ data: { token } });
});

export default router;
