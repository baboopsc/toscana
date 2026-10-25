import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from './generated/prisma/client.js';
import { config } from './config.js';

const adapter = new PrismaPg({ connectionString: config.databaseUrl });

export const prisma = new PrismaClient({ adapter });

/** Hem prisma hem de $transaction içindeki tx bu tipi karşılar. */
export type Db = Prisma.TransactionClient;

/** Unique kısıtı ihlali (P2002 / PostgreSQL 23505). */
export function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = (error as { code?: unknown }).code;
  if (code === 'P2002' || code === '23505') return true;
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' && (message.includes('Unique constraint') || message.includes('23505'));
}
