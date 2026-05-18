import { Request, Response, NextFunction } from 'express';
import { fail } from '../utils/response';

export const requireRole = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return fail(res, 401, 'Unauthorized', ['Not authenticated']);
    }
    if (!roles.includes(req.user.role)) {
      return fail(res, 403, 'Forbidden', ['Insufficient permissions']);
    }
    next();
  };