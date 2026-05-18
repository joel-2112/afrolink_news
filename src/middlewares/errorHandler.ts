import { Request, Response, NextFunction } from 'express';
import { fail } from '../utils/response';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // never leak stack traces to client — constraint #5
  console.error(err.stack);
  return fail(res, 500, 'Internal server error', ['Something went wrong']);
};