import bcrypt from 'bcryptjs';
import type { LoginRequest, LoginResponse, StaffDTO } from '@toscana/shared';
import { prisma } from '../../db.js';
import { HttpError, unauthorized } from '../../lib/httpError.js';
import { signToken, type AuthStaff } from '../../middleware/auth.js';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;
const failedAttempts = new Map<number, { count: number; lockedUntil: number }>();

export async function listActiveStaff(): Promise<StaffDTO[]> {
  return prisma.staff.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: [{ name: 'asc' }],
  });
}

export async function login({ staffId, pin }: LoginRequest): Promise<LoginResponse> {
  const now = Date.now();
  const record = failedAttempts.get(staffId);
  if (record && record.lockedUntil > now) {
    const seconds = Math.ceil((record.lockedUntil - now) / 1000);
    throw new HttpError(429, 'TOO_MANY_ATTEMPTS', `Çok fazla hatalı deneme. ${seconds} saniye sonra tekrar deneyin.`);
  }

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff || !staff.isActive) throw unauthorized('Personel bulunamadı');

  const valid = await bcrypt.compare(pin, staff.pinHash);
  if (!valid) {
    const count = (record?.count ?? 0) + 1;
    if (count >= MAX_ATTEMPTS) {
      failedAttempts.set(staffId, { count: 0, lockedUntil: now + LOCK_MS });
      throw new HttpError(429, 'TOO_MANY_ATTEMPTS', 'Çok fazla hatalı deneme. 1 dakika sonra tekrar deneyin.');
    }
    failedAttempts.set(staffId, { count, lockedUntil: 0 });
    throw unauthorized('PIN hatalı');
  }

  failedAttempts.delete(staffId);
  const dto: StaffDTO = { id: staff.id, name: staff.name, role: staff.role };
  return { token: signToken(dto), staff: dto };
}

export async function me(current: AuthStaff): Promise<StaffDTO> {
  const staff = await prisma.staff.findUnique({
    where: { id: current.id },
    select: { id: true, name: true, role: true, isActive: true },
  });
  if (!staff || !staff.isActive) throw unauthorized('Hesap devre dışı');
  return { id: staff.id, name: staff.name, role: staff.role };
}
