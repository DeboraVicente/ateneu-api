import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }
 const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token não fornecido.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string; email: string; role: string;
    };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acesso restrito a administradores.' });
  }
  next();
}
