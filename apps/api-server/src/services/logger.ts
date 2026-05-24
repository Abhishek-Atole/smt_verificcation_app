import fs from 'fs';
import path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: any;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_LEVEL_ENV = (process.env.LOG_LEVEL as LogLevel) || 'info';
const CURRENT_LOG_LEVEL = LOG_LEVELS[LOG_LEVEL_ENV];

// In-memory ring buffer for recent logs (keep small to avoid memory pressure)
const RECENT_LOGS_CAP = 2000;
const recentLogs: string[] = [];

// Ensure logs dir exists and set a file path
const logsDir = path.join(process.cwd(), 'logs');
try {
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
} catch (e) {
  // ignore
}
const logFile = path.join(logsDir, 'app.log');

function formatLogEntry(level: LogLevel, message: string, meta?: Record<string, any>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta && Object.keys(meta).length > 0 ? meta : {}),
  };
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= CURRENT_LOG_LEVEL;
}

export const logger = {
  debug: (message: string, meta?: Record<string, any>) => {
    if (shouldLog('debug')) {
      const line = JSON.stringify(formatLogEntry('debug', message, meta));
      console.log(line);
      try { fs.appendFileSync(logFile, line + '\n'); } catch (error) { void error; }
      recentLogs.push(line);
      if (recentLogs.length > RECENT_LOGS_CAP) recentLogs.shift();
      tryEmitLog(JSON.parse(line));
    }
  },

  info: (message: string, meta?: Record<string, any>) => {
    if (shouldLog('info')) {
      const line = JSON.stringify(formatLogEntry('info', message, meta));
      console.log(line);
      try { fs.appendFileSync(logFile, line + '\n'); } catch (error) { void error; }
      recentLogs.push(line);
      if (recentLogs.length > RECENT_LOGS_CAP) recentLogs.shift();
      tryEmitLog(JSON.parse(line));
    }
  },

  warn: (message: string, meta?: Record<string, any>) => {
    if (shouldLog('warn')) {
      const line = JSON.stringify(formatLogEntry('warn', message, meta));
      console.warn(line);
      try { fs.appendFileSync(logFile, line + '\n'); } catch (error) { void error; }
      recentLogs.push(line);
      if (recentLogs.length > RECENT_LOGS_CAP) recentLogs.shift();
      tryEmitLog(JSON.parse(line));
    }
  },

  error: (message: string, error?: Error | unknown, meta?: Record<string, any>) => {
    if (shouldLog('error')) {
      const errorData = error instanceof Error ? { errorMessage: error.message, stack: error.stack } : { error };
      const line = JSON.stringify(formatLogEntry('error', message, { ...errorData, ...meta }));
      console.error(line);
      try { fs.appendFileSync(logFile, line + '\n'); } catch (error) { void error; }
      recentLogs.push(line);
      if (recentLogs.length > RECENT_LOGS_CAP) recentLogs.shift();
      tryEmitLog(JSON.parse(line));
    }
  },

  http: (method: string, url: string, statusCode: number, duration: number, meta?: Record<string, any>) => {
    if (shouldLog('info')) {
      const line = JSON.stringify(
        formatLogEntry('info', 'HTTP Request', {
          method,
          url,
          statusCode,
          durationMs: duration,
          ...meta,
        })
      );
      console.log(line);
      try { fs.appendFileSync(logFile, line + '\n'); } catch (error) { void error; }
      recentLogs.push(line);
      if (recentLogs.length > RECENT_LOGS_CAP) recentLogs.shift();
    }
  },
};

let ioRef: any = null;

export const setSocketIO = (io: any) => {
  ioRef = io;
};

export const getRecentLogs = (lines = 200) => {
  if (lines <= 0) return [];
  return recentLogs.slice(-lines);
};

function tryEmitLog(obj: any) {
  try {
    if (ioRef) {
      ioRef.emit('log', obj);
    }
  } catch (e) {
    // ignore
  }
}

export default logger;
