import clsx from 'clsx';

interface WordmarkProps {
  size?: 'sm' | 'lg';
  tone?: 'dark' | 'light';
  className?: string;
}

/** Menüdeki logodan: dağ çizgisi, TOSCANA, Ristorante. */
export function Wordmark({ size = 'sm', tone = 'dark', className }: WordmarkProps) {
  const color = tone === 'light' ? 'text-cream' : 'text-ink';

  if (size === 'sm') {
    return (
      <span className={clsx('inline-flex items-center gap-2', color, className)} aria-label="Toscana Ristorante">
        <svg viewBox="0 0 64 32" className="h-5 w-10" aria-hidden="true">
          <path
            d="M2 26 L18 10 L28 18 L38 6 L50 20 L62 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <span className="font-display text-xl font-semibold tracking-[0.12em]">TOSCANA</span>
      </span>
    );
  }

  return (
    <div className={clsx('flex flex-col items-center', color, className)} aria-label="Toscana Ristorante">
      <svg viewBox="0 0 160 48" className="h-12 w-40" aria-hidden="true">
        <path
          d="M4 40 L44 12 L66 28 L92 6 L120 30 L156 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span className="mt-1 h-px w-56 bg-current opacity-40" />
      <span className="mt-2 font-display text-5xl font-semibold tracking-[0.14em]">TOSCANA</span>
      <span className="mt-1 h-px w-56 bg-current opacity-40" />
      <span className="mt-2 text-sm tracking-[0.5em] opacity-80">RISTORANTE</span>
      <span className="mt-2 font-display text-lg italic opacity-80">İtalya&apos;nın Sofrasında</span>
    </div>
  );
}
