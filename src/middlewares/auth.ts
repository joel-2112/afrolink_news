import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { fail } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return fail(res, 401, 'Unauthorized', ['No token provided']);
  }
  try {
    req.user = verifyToken(header.split(' ')[1]);
    next();
  } catch {
    return fail(res, 401, 'Unauthorized', ['Invalid or expired token']);
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(header.split(' ')[1]);
    } catch {
      
    }
  }
  next();
};