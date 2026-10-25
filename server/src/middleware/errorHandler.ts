import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../lib/httpError.js';

export const apiNotFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Böyle bir API adresi yok' } });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (typeof error === 'object' && error !== null && (error as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'İstek gövdesi geçerli JSON değil' } });
    return;
  }
  console.error('[hata]', error);
  res.status(500).json({
    error: { code: 'INTERNAL', message: 'Sunucuda beklenmeyen bir hata oluştu. Kasa bilgisayarındaki kayıtlara bakın.' },
  });
};
