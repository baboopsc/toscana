import clsx from 'clsx';
import type { ReactNode } from 'react';
import type { OrderItemDTO } from '@toscana/shared';
import { formatTL } from '../lib/format';
import { Badge } from './ui/Badge';

/** Adisyon satırı: adet × ürün, ekstralar, not, durum ve tutar. */
export function OrderItemLine({ item, leading, trailing }: { item: OrderItemDTO; leading?: ReactNode; trailing?: ReactNode }) {
  const isVoid = item.status === 'VOID';
  const fullyPaid = !isVoid && item.paidQuantity >= item.quantity;
  const partlyPaid = !isVoid && item.paidQuantity > 0 && !fullyPaid;

  return (
    <div className={clsx('flex items-start gap-3 py-2.5', (isVoid || fullyPaid) && 'opacity-60')}>
      {leading}
      <div className="min-w-0 flex-1">
        <p className={clsx('font-medium leading-snug', isVoid && 'line-through')}>
          <span className="tabular-nums">{item.quantity}×</span> {item.productName}
        </p>
        {item.modifiers.map((modifier, index) => (
          <p key={index} className="text-sm text-olive">
            + {modifier.name}
          </p>
        ))}
        {item.note ? <p className="text-sm font-medium text-amber">{item.note}</p> : null}
        <div className="mt-1 flex flex-wrap gap-1">
          {isVoid ? <Badge tone="void">İptal{item.voidReason ? `: ${item.voidReason}` : ''}</Badge> : null}
          {fullyPaid ? <Badge tone="paid">Ödendi</Badge> : null}
          {partlyPaid ? (
            <Badge tone="paid">
              {item.paidQuantity}/{item.quantity} ödendi
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={clsx('font-semibold tabular-nums', isVoid && 'line-through')}>{formatTL(item.lineTotal)}</span>
        {trailing}
      </div>
    </div>
  );
}
