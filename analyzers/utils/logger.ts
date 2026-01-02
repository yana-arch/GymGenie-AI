/**
 * Log level enumeration
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  timestamp?: boolean;
}

/**
 * Simple logger for analysis operations
 */
export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      prefix: config.prefix,
      timestamp: config.timestamp ?? true,
    };
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.config.level <= LogLevel.DEBUG) {
      this.log('DEBUG', message, ...args);
    }
  }

  /**
   * Log info message
   */
  info(message: string, ...args: unknown[]): void {
    if (this.config.level <= LogLevel.INFO) {
      this.log('INFO', message, ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.config.level <= LogLevel.WARN) {
      this.log('WARN', message, ...args);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.config.level <= LogLevel.ERROR) {
      if (error instanceof Error) {
        this.log('ERROR', message, error.message, error.stack, ...args);
      } else {
        this.log('ERROR', message, error, ...args);
      }
    }
  }

  /**
   * Create a child logger with a prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
    });
  }

  /**
   * Internal log method
   */
  private log(level: string, message: string, ...args: unknown[]): void {
    const parts: string[] = [];

    if (this.config.timestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(`[${level}]`);

    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }

    parts.push(message);

    const formattedMessage = parts.join(' ');

    if (level === 'ERROR') {
      console.error(formattedMessage, ...args);
    } else if (level === 'WARN') {
      console.warn(formattedMessage, ...args);
    } else {
      console.log(formattedMessage, ...args);
    }
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }
}

/**
 * Default logger instance
 */
export const defaultLogger = new Logger();
