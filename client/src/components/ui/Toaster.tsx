import clsx from 'clsx';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { dismissToast, type Toast } from '../../features/toast/toastSlice';

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const id = window.setTimeout(() => dispatch(dismissToast(toast.id)), toast.tone === 'error' ? 6000 : 3500);
    return () => window.clearTimeout(id);
  }, [dispatch, toast.id, toast.tone]);

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={clsx(
        'pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 text-[15px] font-medium shadow-lg',
        toast.tone === 'success' && 'bg-basil text-white',
        toast.tone === 'error' && 'bg-terracotta text-white',
        toast.tone === 'info' && 'bg-ink text-cream',
      )}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => dispatch(dismissToast(toast.id))}
        className="-mr-1 text-lg leading-none opacity-80 hover:opacity-100"
        aria-label="Bildirimi kapat"
      >
        ×
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useAppSelector((state) => state.toast.items);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] mx-auto flex w-full max-w-md flex-col gap-2 px-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
