import type { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { StaffRole } from '@toscana/shared';
import { config } from '../config.js';
import { forbidden, unauthorized } from '../lib/httpError.js';

export interface AuthStaff {
  id: number;
  name: string;
  role: StaffRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      staff?: AuthStaff;
    }
  }
}

const ROLES: StaffRole[] = ['ADMIN', 'CASHIER', 'WAITER', 'KITCHEN'];

export function signToken(staff: AuthStaff): string {
  // Mutfak ekranı her sabah giriş yapmasın diye 30 gün, diğerleri bir vardiya.
  const expiresIn = staff.role === 'KITCHEN' ? '30d' : '12h';
  return jwt.sign({ sub: String(staff.id), name: staff.name, role: staff.role }, config.jwtSecret, {
    expiresIn,
  });
}

export function verifyToken(token: string): AuthStaff {
  const payload = jwt.verify(token, config.jwtSecret);
  if (typeof payload === 'string') throw unauthorized();
  const id = Number(payload.sub);
  const role = payload.role as StaffRole;
  if (!Number.isInteger(id) || !ROLES.includes(role)) throw unauthorized();
  return { id, name: String(payload.name ?? ''), role };
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(unauthorized());
    return;
  }
  try {
    req.staff = verifyToken(header.slice('Bearer '.length));
    next();
  } catch {
    next(unauthorized('Oturumun süresi doldu, tekrar giriş yapın'));
  }
};

export function requireRole(...roles: StaffRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.staff) {
      next(unauthorized());
      return;
    }
    if (!roles.includes(req.staff.role)) {
      next(forbidden());
      return;
    }
    next();
  };
}

export function currentStaff(req: Request): AuthStaff {
  if (!req.staff) throw unauthorized();
  return req.staff;
}
