import type { ApiErrorBody } from '@toscana/shared';

/** RTK Query hatasını personelin anlayacağı bir cümleye çevirir. */
export function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const { status, data } = error as { status: unknown; data?: unknown };
    if (status === 'FETCH_ERROR') return 'Sunucuya ulaşılamıyor. Wi-Fi bağlantısını ve kasa bilgisayarını kontrol edin.';
    if (status === 'TIMEOUT_ERROR') return 'Sunucu yanıt vermedi, tekrar deneyin.';
    const body = data as Partial<ApiErrorBody> | undefined;
    if (body?.error?.message) return body.error.message;
    if (typeof status === 'number') return `İşlem tamamlanamadı (hata ${status}).`;
  }
  return 'Beklenmeyen bir hata oluştu, tekrar deneyin.';
}
