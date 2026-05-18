import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { fail } from '../utils/response';

export const validate = (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message);
      return fail(res, 400, 'Validation failed', errors);
    }
    req.body = result.data;  // replace with parsed + typed data
    next();
  };