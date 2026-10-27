import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';

// In containers/cloud, logs go to stdout as JSON and the platform collects them.
// Rotating files are opt-in (LOG_TO_FILE=true), useful for local runs.
const consoleTransport = new winston.transports.Console({
  format: isProduction
    ? winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json())
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const extras = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `[${timestamp}] ${level}: ${message} ${extras}`;
        })
      ),
});

const transports: winston.transport[] = [consoleTransport];

if (process.env.LOG_TO_FILE === 'true') {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const fileFormat = winston.format.combine(winston.format.timestamp(), winston.format.json());
  transports.push(
    new DailyRotateFile({ filename: 'error-%DATE%.log', dirname: logDir, datePattern: 'YYYY-MM-DD', zippedArchive: true, maxSize: '10m', maxFiles: '14d', level: 'error', format: fileFormat }),
    new DailyRotateFile({ filename: 'api-%DATE%.log', dirname: logDir, datePattern: 'YYYY-MM-DD', zippedArchive: true, maxSize: '10m', maxFiles: '7d', level: 'http', format: fileFormat }),
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  transports,
});
