import type { ReactNode } from 'react';

export function Loading({ label = 'Yükleniyor' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-soft" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {label}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="font-display text-2xl font-semibold">{title}</p>
      {children ? <div className="max-w-sm text-ink-soft">{children}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center" role="alert">
      <p className="font-semibold text-terracotta">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="rounded-lg border border-line px-4 py-2 font-medium hover:bg-paper">
          Tekrar dene
        </button>
      ) : null}
    </div>
  );
}
