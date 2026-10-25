import clsx from 'clsx';
import { useAppSelector } from '../../app/hooks';

/** Bağlantı koptuğunda ekranın üstünde görünen şerit. */
export function ConnectionBanner() {
  const status = useAppSelector((state) => state.connection.status);
  if (status !== 'offline') return null;
  return (
    <div role="alert" className="bg-terracotta px-4 py-2 text-center text-sm font-medium text-white">
      Sunucu bağlantısı yok, yeniden deneniyor. Sipariş gönderilemez.
    </div>
  );
}

/** Başlıktaki küçük bağlantı göstergesi. */
export function ConnectionDot({ className }: { className?: string }) {
  const status = useAppSelector((state) => state.connection.status);
  const label = status === 'online' ? 'Bağlı' : status === 'offline' ? 'Bağlantı yok' : 'Bağlanıyor';
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-sm', className)} title={label}>
      <span
        className={clsx(
          'size-2.5 rounded-full',
          status === 'online' && 'bg-emerald-500',
          status === 'offline' && 'bg-terracotta',
          (status === 'connecting' || status === 'idle') && 'bg-amber-400',
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
