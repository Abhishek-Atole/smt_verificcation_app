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
      console.log(JSON.stringify(formatLogEntry('debug', message, meta)));
    }
  },

  info: (message: string, meta?: Record<string, any>) => {
    if (shouldLog('info')) {
      console.log(JSON.stringify(formatLogEntry('info', message, meta)));
    }
  },

  warn: (message: string, meta?: Record<string, any>) => {
    if (shouldLog('warn')) {
      console.warn(JSON.stringify(formatLogEntry('warn', message, meta)));
    }
  },

  error: (message: string, error?: Error | unknown, meta?: Record<string, any>) => {
    if (shouldLog('error')) {
      const errorData = error instanceof Error ? { errorMessage: error.message, stack: error.stack } : { error };
      console.error(JSON.stringify(formatLogEntry('error', message, { ...errorData, ...meta })));
    }
  },

  http: (method: string, url: string, statusCode: number, duration: number, meta?: Record<string, any>) => {
    if (shouldLog('info')) {
      console.log(
        JSON.stringify(
          formatLogEntry('info', 'HTTP Request', {
            method,
            url,
            statusCode,
            durationMs: duration,
            ...meta,
          })
        )
      );
    }
  },
};

export default logger;
