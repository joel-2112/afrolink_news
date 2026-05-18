import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser } from './auth.service';
import { ok, created, fail } from '../../utils/response';
import { RegisterInput, LoginInput } from './auth.schema';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = req.body as RegisterInput;
    const result = await registerUser(input);

    
    if ('conflict' in result) {
      return fail(res, 409, 'Email already exists', [
        'An account with this email already exists',
      ]);
    }

    return created(res, 'Account created successfully', result.user);
  } catch (err) {
    next(err); 
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = req.body as LoginInput;
    const result = await loginUser(input);

    
    if ('invalid' in result) {
      return fail(res, 401, 'Invalid credentials', [
        'Email or password is incorrect',
      ]);
    }

    return ok(res, 'Login successful', {
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
};