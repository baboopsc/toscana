import clsx from 'clsx';
import type { TableSummaryDTO } from '@toscana/shared';
import { formatDuration, formatTL, minutesSince } from '../lib/format';

interface TableTileProps {
  table: TableSummaryDTO;
  now: number;
  onSelect: () => void;
  hasDraft?: boolean;
  size?: 'md' | 'lg';
}

/** Masa kutusu: menüdeki başlıklar gibi serif masa adı; doluysa tutar ve geçen süre. */
export function TableTile({ table, now, onSelect, hasDraft = false, size = 'md' }: TableTileProps) {
  const occupied = table.orderId !== null;
  const minutes = table.openedAt ? minutesSince(table.openedAt, now) : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'relative flex flex-col items-start justify-between rounded-xl border text-left transition-colors',
        size === 'lg' ? 'min-h-28 p-4' : 'min-h-24 p-3',
        occupied
          ? 'border-terracotta/50 bg-terracotta-soft hover:border-terracotta'
          : 'border-line bg-white hover:border-ink/40',
      )}
      aria-label={occupied ? `Masa ${table.name}, dolu, ${formatTL(table.total)}` : `Masa ${table.name}, boş`}
    >
      <span className={clsx('font-display font-semibold leading-none', size === 'lg' ? 'text-4xl' : 'text-3xl')}>
        {table.name}
      </span>
      {occupied ? (
        <span className="mt-2 flex w-full flex-wrap items-baseline justify-between gap-x-2 text-sm">
          <span className="font-semibold tabular-nums">{formatTL(table.total)}</span>
          <span className="text-ink-soft tabular-nums">{formatDuration(minutes)}</span>
        </span>
      ) : (
        <span className="mt-2 text-sm text-ink-soft">Boş</span>
      )}
      {hasDraft ? (
        <span
          className="absolute right-2 top-2 size-2.5 rounded-full bg-amber-500"
          title="Gönderilmemiş sepet var"
          aria-label="Gönderilmemiş sepet var"
        />
      ) : null}
    </button>
  );
}
