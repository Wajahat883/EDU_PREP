/**
 * Logger Utility
 * Location: services/payment-service/src/utils/logger.ts
 *
 * Centralized logging for the payment service
 */

enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  stack?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== "production";

  private formatLog(level: LogLevel, message: string, context?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
    };
  }

  error(message: string, error?: any) {
    const entry = this.formatLog(LogLevel.ERROR, message, error);
    console.error(JSON.stringify(entry));
  }

  warn(message: string, context?: any) {
    const entry = this.formatLog(LogLevel.WARN, message, context);
    console.warn(JSON.stringify(entry));
  }

  info(message: string, context?: any) {
    const entry = this.formatLog(LogLevel.INFO, message, context);
    if (this.isDevelopment) {
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: any) {
    if (this.isDevelopment) {
      const entry = this.formatLog(LogLevel.DEBUG, message, context);
      console.log(JSON.stringify(entry));
    }
  }
}

export default new Logger();
