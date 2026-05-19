import express, { Application } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '@smt/config';
import { initializeSocketIO } from './realtime/socket-server';
import { healthRouter } from './routes/health';
import usersRouter from './routes/users';
import bomsRouter from './routes/boms';
import sessionsRouter from './routes/sessions';
import metricsRouter from './routes/metrics';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { requestLoggerMiddleware } from './middleware/request-logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLoggerMiddleware);
app.use(rateLimitMiddleware);

// Store IO instance for routes
app.set('io', io);

// Initialize Socket.IO
initializeSocketIO(io);

// Routes
app.use('/api/health', healthRouter);
app.use('/api/users', usersRouter);
app.use('/api/boms', bomsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/metrics', metricsRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    // Verify database connection
    console.log('📦 Verifying database connection...');
    // TODO: Add actual DB health check when ready

    httpServer.listen(PORT, () => {
      console.log(`✅ API Server running on http://localhost:${PORT}`);
      console.log(`✅ Socket.IO ready at ws://localhost:${PORT}`);
      console.log(`📝 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📋 SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📋 SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

startServer();
