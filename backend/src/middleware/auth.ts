import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'badori-secret-key-2024';

export interface AuthRequest extends Request {
  userId?: string;
  userCountry?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; country: string };
    req.userId = payload.userId;
    req.userCountry = payload.country;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function signToken(userId: string, country: string): string {
  return jwt.sign({ userId, country }, JWT_SECRET, { expiresIn: '24h' });
}
