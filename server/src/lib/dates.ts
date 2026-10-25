import { badRequest } from './httpError.js';

/** Sunucunun yerel saatine göre bugünün tarihi: "2026-10-25". */
export function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** "2026-10-25" → o günün yerel 00:00'ı ile ertesi günün 00:00'ı. */
export function dayRange(date: string): { start: Date; end: Date } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw badRequest('INVALID_DATE', 'Tarih YYYY-AA-GG biçiminde olmalı');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 1);
  if (Number.isNaN(start.getTime()) || start.getMonth() !== month - 1) {
    throw badRequest('INVALID_DATE', 'Geçersiz tarih');
  }
  return { start, end };
}
