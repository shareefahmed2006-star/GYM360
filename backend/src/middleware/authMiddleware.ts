import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types/auth';
import { verifyToken } from '../services/tokenService';
import { AppError } from './errorHandler';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required: Missing or malformed Bearer token.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Authentication token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token.', 401));
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Access denied: Insufficient permissions for this resource.', 403));
    }

    next();
  };
};

export const requireRole = authorize;

