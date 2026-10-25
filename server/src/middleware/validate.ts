import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { badRequest } from '../lib/httpError.js';

/** İstek gövdesini zod şemasıyla doğrular; geçerliyse req.body temizlenmiş veriyle değişir. */
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue && issue.path.length > 0 ? issue.path.join('.') : 'istek';
      next(badRequest('VALIDATION_ERROR', `Geçersiz alan (${field}): ${issue?.message ?? 'hatalı değer'}`));
      return;
    }
    req.body = result.data;
    next();
  };
}

/** URL'deki :id parametresini pozitif tam sayıya çevirir. */
export function parseId(value: unknown, label = 'kayıt'): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('INVALID_ID', `Geçersiz ${label} numarası`);
  return id;
}
