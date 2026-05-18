import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET!;
const EXPIRES = process.env.JWT_EXPIRES_IN ?? '24h';

export interface JwtPayload {
  sub: string;   
  role: string;
}

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, SECRET, { expiresIn: EXPIRES as any });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, SECRET) as JwtPayload;