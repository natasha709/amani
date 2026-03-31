import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  responseTime: number;
  ip: string;
  userAgent: string;
  userId?: string;
  schoolId?: string;
}

const logDirectory = path.join(process.cwd(), 'logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const getLogFileName = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return path.join(logDirectory, `access-${year}-${month}-${day}.log`);
};

const writeLog = (entry: LogEntry): void => {
  const logFile = getLogFileName();
  const logLine = JSON.stringify(entry) + '\n';
  
  fs.appendFile(logFile, logLine, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end.bind(res);

  // Override end function to log request
  res.end = function (this: Response, chunk?: any, encoding?: BufferEncoding | string, cb?: () => void) {
    const responseTime = Date.now() - startTime;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      userId: (req as any).user?.id,
      schoolId: (req as any).user?.schoolId,
    };

    // Write to file
    writeLog(logEntry);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const statusColor = res.statusCode >= 400 ? '\x1b[31m' : res.statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
      console.log(
        `${statusColor}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl || req.url} - ${responseTime}ms`
      );
    }

    // Call original end function
    return originalEnd(chunk, encoding as BufferEncoding, cb);
  } as typeof res.end;

  next();
};

// Request logger with custom options
export const requestLoggerWithOptions = (options: {
  logToFile?: boolean;
  logToConsole?: boolean;
  logBody?: boolean;
  logHeaders?: boolean;
  excludePaths?: string[];
} = {}) => {
  const {
    logToFile = true,
    logToConsole = process.env.NODE_ENV === 'development',
    logBody = false,
    logHeaders = false,
    excludePaths = ['/api/health'],
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.originalUrl.includes(path))) {
      return next();
    }

    const startTime = Date.now();

    // Store original end function
    const originalEnd = res.end.bind(res);

    // Override end function to log request
    res.end = function (this: Response, chunk?: any, encoding?: BufferEncoding | string, cb?: () => void) {
      const responseTime = Date.now() - startTime;

      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        responseTime,
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        userId: (req as any).user?.id,
        schoolId: (req as any).user?.schoolId,
      };

      // Write to file
      if (logToFile) {
        writeLog(logEntry);
      }

      // Log to console
      if (logToConsole) {
        const statusColor = res.statusCode >= 400 ? '\x1b[31m' : res.statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
        console.log(
          `${statusColor}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl || req.url} - ${responseTime}ms`
        );
      }

      // Call original end function
      return originalEnd(chunk, encoding as BufferEncoding, cb);
    } as typeof res.end;

    next();
  };
};
