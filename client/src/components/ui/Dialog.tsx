import clsx from 'clsx';
import { useEffect, useId, useRef, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

/** Telefonda alttan açılan, büyük ekranda ortada duran pencere. Esc ile kapanır. */
export function Dialog({ open, onClose, title, children, footer, size = 'md' }: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>('input, textarea, button:not([data-close])');
    (focusable ?? panel)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink/45" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={clsx(
          'relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl',
          size === 'sm' && 'sm:max-w-sm',
          size === 'md' && 'sm:max-w-md',
          size === 'lg' && 'sm:max-w-2xl',
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            data-close
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-xl text-ink-soft hover:bg-ink/5"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="pb-safe border-t border-line px-5 pt-3">{footer}</div> : null}
      </div>
    </div>
  );
}
