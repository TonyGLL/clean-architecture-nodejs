import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/winston';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { method, url, body, params, query } = req;
  const logMessage = {
    method,
    url,
    body,
    params,
    query,
  };
  logger.info('Request received', logMessage);
  next();
};
