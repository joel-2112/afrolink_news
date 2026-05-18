import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { fail } from '../utils/response';

// extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// hard auth — rejects if no token
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

// soft auth — attaches user if token present, continues as guest if not
// used for GET /articles/:id (reader may or may not be logged in)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(header.split(' ')[1]);
    } catch {
      // invalid token — treat as guest, don't block
    }
  }
  next();
};