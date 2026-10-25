import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
      statusCode: 404
    }
  });
};

export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Clean error response - never expose secrets or raw stack traces in production
  const responsePayload: {
    success: boolean;
    error: {
      message: string;
      statusCode: number;
      stack?: string;
    };
  } = {
    success: false,
    error: {
      message,
      statusCode
    }
  };

  if (config.nodeEnv === 'development' && err.stack) {
    responsePayload.error.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};
