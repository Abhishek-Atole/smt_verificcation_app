import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '@smt/config';
import { AuthPayload } from '@smt/api-types';
import { AuthError } from '../errors';
import { logger } from '../services/logger';

interface SocketData {
  userId: string;
  userEmail: string;
  userRole: string;
  _rateLimit?: { count: number; resetAt: number };
}

export function initializeSocketIO(io: Server<any, any, any, SocketData>): void {
  // Middleware: JWT authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        throw new AuthError('No authentication token provided');
      }

      const payload = jwt.verify(token, env.JWT_SECRET, {
        algorithms: [env.JWT_ALGORITHM as any],
      }) as AuthPayload;

      socket.data.userId = payload.userId;
      socket.data.userEmail = payload.email;
      socket.data.userRole = payload.role;

      next();
    } catch (error) {
      if (error instanceof Error) {
        next(new Error(error.message));
      } else {
        next(new Error('Authentication failed'));
      }
    }
  });

  // Rate limiting per socket
  io.use((socket, next) => {
    if (!socket.data._rateLimit) {
      socket.data._rateLimit = { count: 0, resetAt: Date.now() + 1000 };
    }

    const rateLimit = socket.data._rateLimit as { count: number; resetAt: number };
    const rateLimitEvents = env.SOCKET_RATE_LIMIT; // Configurable rate limit

    if (Date.now() >= rateLimit.resetAt) {
      rateLimit.count = 1;
      rateLimit.resetAt = Date.now() + 1000;
    } else {
      rateLimit.count++;

      // Configurable events per second per socket
      if (rateLimit.count > rateLimitEvents) {
        next(new Error(`Rate limit exceeded: ${rateLimitEvents} events per second`));
        return;
      }
    }

    next();
  });

  // Connection handlers
  io.on('connection', (socket: Socket<any, any, any, SocketData>) => {
    logger.info('Socket connected', { socketId: socket.id, userEmail: socket.data.userEmail });

    // Join user-specific room
    socket.join(`user:${socket.data.userId}`);

    // Join role-specific room
    socket.join(`role:${socket.data.userRole}`);

    // Emit connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      userId: socket.data.userId,
      timestamp: new Date().toISOString(),
    });

    // Handle session join
    socket.on('join:session', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      logger.info('Socket joined session', { socketId: socket.id, sessionId });

      // Notify others in session
      io.to(`session:${sessionId}`).emit('session:operator_joined', {
        socketId: socket.id,
        userId: socket.data.userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle session leave
    socket.on('leave:session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
      logger.info('Socket left session', { socketId: socket.id, sessionId });

      io.to(`session:${sessionId}`).emit('session:operator_left', {
        socketId: socket.id,
        userId: socket.data.userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle scan event
    socket.on('scan:event', (data: any) => {
      // Validate and broadcast to session
      io.to(`session:${data.sessionId}`).emit('scan:update', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id });
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      logger.error('Socket error', error, { socketId: socket.id });
    });
  });
}

// Broadcast helper functions
export function broadcastToUser(io: Server, userId: string, event: string, data: any): void {
  io.to(`user:${userId}`).emit(event, data);
}

export function broadcastToRole(io: Server, role: string, event: string, data: any): void {
  io.to(`role:${role}`).emit(event, data);
}

export function broadcastToSession(
  io: Server,
  sessionId: string,
  event: string,
  data: any
): void {
  io.to(`session:${sessionId}`).emit(event, data);
}

export function broadcastToAll(io: Server, event: string, data: any): void {
  io.emit(event, data);
}
