import clsx from 'clsx';
import type { TicketDTO } from '@toscana/shared';
import { formatDuration, formatTime, minutesSince } from '../../lib/format';

interface TicketCardProps {
  ticket: TicketDTO;
  now: number;
  onComplete: () => void;
  completing: boolean;
}

/** Mutfak kartı: başlıkta masa ve süre, altında kalemler ve belirgin notlar. */
export function TicketCard({ ticket, now, onComplete, completing }: TicketCardProps) {
  const minutes = minutesSince(ticket.createdAt, now);
  const tone = minutes >= 20 ? 'late' : minutes >= 10 ? 'waiting' : 'fresh';

  return (
    <article
      className="ticket-in flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5"
      aria-label={`Masa ${ticket.tableName}, ${minutes} dakika`}
    >
      <header
        className={clsx(
          'flex items-start justify-between gap-3 px-4 py-3',
          tone === 'fresh' && 'bg-basil-soft text-ink',
          tone === 'waiting' && 'bg-amber-soft text-ink',
          tone === 'late' && 'bg-terracotta text-white',
        )}
      >
        <div className="min-w-0">
          <p className="font-display text-5xl font-semibold leading-none">{ticket.tableName}</p>
          <p className={clsx('mt-1 truncate text-sm', tone === 'late' ? 'text-white/85' : 'text-ink-soft')}>
            {ticket.waiterName}
            {ticket.round > 1 ? (
              <span
                className={clsx(
                  'ml-2 rounded px-1.5 py-0.5 text-xs font-semibold',
                  tone === 'late' ? 'bg-white/20' : 'bg-ink text-cream',
                )}
              >
                {ticket.round}. tur
              </span>
            ) : null}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold leading-none tabular-nums">{formatDuration(minutes)}</p>
          <p className={clsx('mt-1 text-sm tabular-nums', tone === 'late' ? 'text-white/85' : 'text-ink-soft')}>
            {formatTime(ticket.createdAt)}
          </p>
        </div>
      </header>

      <ul className="flex-1 divide-y divide-line px-4">
        {ticket.items.map((item) => {
          const isVoid = item.status === 'VOID';
          return (
            <li key={item.id} className="py-3">
              <p className={clsx('text-xl font-semibold leading-snug', isVoid && 'text-terracotta line-through')}>
                <span className="tabular-nums">{item.quantity}×</span> {item.productName}
              </p>
              {isVoid ? <p className="text-sm font-bold text-terracotta">İPTAL, hazırlamayın</p> : null}
              {item.modifiers.map((modifier, index) => (
                <p key={index} className={clsx('text-lg font-semibold text-olive', isVoid && 'line-through')}>
                  + {modifier.name}
                </p>
              ))}
              {item.note ? (
                <p
                  className={clsx(
                    'mt-1.5 inline-block rounded-md bg-amber-soft px-2.5 py-1 text-lg font-bold text-amber',
                    isVoid && 'line-through',
                  )}
                >
                  {item.note}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onComplete}
        disabled={completing}
        className="h-16 bg-basil text-xl font-semibold text-white transition-colors hover:bg-basil/90 disabled:opacity-60"
      >
        Tamamla
      </button>
    </article>
  );
}
