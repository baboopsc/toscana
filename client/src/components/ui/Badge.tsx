import clsx from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'new' | 'muted' | 'paid' | 'void' | 'warning' | 'info';

const tones: Record<Tone, string> = {
  new: 'bg-terracotta text-white',
  muted: 'bg-ink/8 text-ink-soft',
  paid: 'bg-basil-soft text-basil',
  void: 'bg-terracotta-soft text-terracotta',
  warning: 'bg-amber-soft text-amber',
  info: 'bg-olive-soft text-olive',
};

export function Badge({ tone = 'muted', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold leading-none tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
