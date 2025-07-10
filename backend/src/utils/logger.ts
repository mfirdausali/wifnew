import winston from 'winston';
import { env } from '@config/env';

const formats = {
  json: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  dev: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let log = `${timestamp} [${level}]: ${message}`;
      if (Object.keys(meta).length) {
        log += ` ${JSON.stringify(meta)}`;
      }
      if (stack) {
        log += `\n${stack}`;
      }
      return log;
    })
  ),
};

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: formats[env.LOG_FORMAT],
  transports: [
    new winston.transports.Console(),
  ],
});

// Add file transport in production
if (env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
  }));
}

export default logger;