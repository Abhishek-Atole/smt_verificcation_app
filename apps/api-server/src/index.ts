import 'dotenv/config.js';
import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '@smt/config';
import { checkDatabaseConnection } from '@smt/db';
import { initializeSocketIO } from './realtime/socket-server';
import { healthRouter } from './routes/health';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import bomsRouter from './routes/boms';
import sessionsRouter from './routes/sessions';
import metricsRouter from './routes/metrics';
import scansRouter from './routes/scans';
import auditRouter from './routes/audit';
import internalRouter from './routes/internal';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { requestLoggerMiddleware } from './middleware/request-logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { extractIPAddress, hashIP } from './utils';
import { securityHeadersMiddleware } from './middleware/security-headers';
import { csrfMiddleware } from './middleware/csrf';
import { logger } from './services/logger';
import { setSocketIO } from './services/logger';

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow missing/null origin in development (Electron file:// or devtools)
      if (!origin) {
        if (env.NODE_ENV === 'production') {
          callback(new Error('CORS origin missing'));
          return;
        }
        callback(null, true);
        return;
      }

      const allowed = ['http://localhost:5173', 'http://localhost:3000'];
      if (allowed.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Determine allowed origins based on environment
const ALLOWED_ORIGINS = 
  env.NODE_ENV === 'development'
    ? [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:3000',
      ]
    : [
        // Production: allow only from specific origin (read from env or default to localhost)
        process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
      ];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security headers - must be early in the middleware chain
app.use(securityHeadersMiddleware);

// IP extraction middleware - must run BEFORE rate limiting and logging
app.use((req: any, _res, next) => {
  const ip = extractIPAddress(req.headers);
  req.ipHash = hashIP(ip);
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow null/undefined origin (file:// / Electron) in development
      if (!origin) {
        if (env.NODE_ENV === 'production') {
            logger.warn('CORS: missing origin in production', { origin });
            callback(new Error('CORS origin missing'));
          return;
        }
          logger.debug('CORS: allowing missing/null origin in development', { origin });
          callback(null, true);
        return;
      }
        if (ALLOWED_ORIGINS.includes(origin)) {
          logger.debug('CORS: origin allowed', { origin });
          callback(null, true);
          return;
        }

        logger.warn('CORS: origin not allowed', { origin });
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    exposedHeaders: ['x-csrf-token'],
    maxAge: 3600,
  })
);
app.use(csrfMiddleware);
app.use(requestLoggerMiddleware);
app.use(rateLimitMiddleware);

// Store IO instance for routes
app.set('io', io as any);

// Initialize Socket.IO
initializeSocketIO(io);
// expose io to logger so logs can be pushed to connected clients
setSocketIO(io);

// Routes - API v1
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/boms', bomsRouter);
app.use('/api/v1/sessions', sessionsRouter);
app.use('/api/v1/metrics', metricsRouter);
app.use('/api/v1/scans', scansRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/internal', internalRouter);

// Health endpoint at root level for load balancers
app.get('/health', (_req: any, res: any) => {
  res.json({ status: 'ok', service: 'api-server' });
});

// Readiness endpoint: verifies dependent services (DB) are available
app.get('/ready', async (_req: any, res: any) => {
  try {
    const ok = await checkDatabaseConnection();
    if (!ok) {
      logger.warn('Readiness check failed: database unavailable');
      res.status(503).json({ status: 'unavailable', reason: 'database' });
      return;
    }

    res.json({ status: 'ready' });
  } catch (err) {
    logger.error('Readiness check error', err as any);
    res.status(500).json({ status: 'error' });
  }
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    // Verify database connection BEFORE listening
    logger.info('Verifying database connection...');
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      logger.error('Cannot connect to PostgreSQL. Check DATABASE_URL.');
      process.exit(1);
    }
    logger.info('Database connection verified');

    httpServer.listen(PORT, () => {
      logger.info(`API Server running on http://localhost:${PORT}`);
      logger.info(`Socket.IO ready at ws://localhost:${PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Consolidated graceful shutdown handler
async function performShutdown(reason = 'shutdown') {
  try {
    logger.info(`Shutdown initiated: ${reason}`);
    // stop accepting new connections
    httpServer.close(async (err?: Error) => {
      if (err) {
        logger.error('Error closing HTTP server', err);
      } else {
        logger.info('HTTP server closed');
      }

      try {
        const { db } = await import('@smt/db');
        if ((db as any)?.$client && typeof (db as any).$client.end === 'function') {
          await (db as any).$client.end();
          logger.info('Database pool closed');
        }
      } catch (dbErr) {
        logger.error('Error closing database during shutdown', dbErr);
      }

      // flush any in-memory logs (best-effort)
      logger.info('Shutdown complete, exiting process');
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10_000).unref();
  } catch (e) {
    logger.error('performShutdown failed', e);
    process.exit(1);
  }
}

process.on('SIGTERM', () => performShutdown('SIGTERM'));
process.on('SIGINT', () => performShutdown('SIGINT'));

// Handle unexpected errors and attempt to shutdown gracefully
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise rejection', reason as any);
  performShutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  performShutdown('uncaughtException');
});

// Export for testing
export { app, httpServer, io };

startServer();
