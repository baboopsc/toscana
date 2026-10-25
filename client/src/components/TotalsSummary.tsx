import clsx from 'clsx';
import { vatRatesOf, type OrderDTO } from '@toscana/shared';
import { formatTL } from '../lib/format';

/** Ara toplam (KDV hariç), KDV, genel toplam, ödenen ve kalan. */
export function TotalsSummary({ order, large = false }: { order: OrderDTO; large?: boolean }) {
  const { totals } = order;
  const rates = vatRatesOf(order.items);
  const vatLabel = rates.length === 1 ? `KDV (%${rates[0]})` : 'KDV';

  return (
    <dl className="flex flex-col gap-1 text-[15px]">
      <div className="flex justify-between text-ink-soft">
        <dt>Ara toplam (KDV hariç)</dt>
        <dd className="tabular-nums">{formatTL(totals.net, { fixed: true })}</dd>
      </div>
      <div className="flex justify-between text-ink-soft">
        <dt>{vatLabel}</dt>
        <dd className="tabular-nums">{formatTL(totals.vat, { fixed: true })}</dd>
      </div>
      <div className="flex justify-between font-semibold">
        <dt>Genel toplam</dt>
        <dd className="tabular-nums">{formatTL(totals.gross, { fixed: true })}</dd>
      </div>
      {totals.paid > 0 ? (
        <div className="flex justify-between text-basil">
          <dt>Ödenen</dt>
          <dd className="tabular-nums">{formatTL(totals.paid, { fixed: true })}</dd>
        </div>
      ) : null}
      <div className={clsx('mt-1 flex items-baseline justify-between border-t border-line pt-2', large ? 'text-2xl' : 'text-xl')}>
        <dt className="font-semibold">Kalan</dt>
        <dd className="font-bold tabular-nums">{formatTL(totals.remaining, { fixed: true })}</dd>
      </div>
    </dl>
  );
}
