import { useEffect, useState } from 'react';
import { PAYMENT_LABELS, parseTL, type PaymentMethod } from '@toscana/shared';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { formatTL } from '../../lib/format';

interface PaymentDialogProps {
  open: boolean;
  method: PaymentMethod;
  amount: number;
  partial: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
}

/** Nakitte alınan tutar ve para üstü; kartta POS cihazından çekme hatırlatması. */
export function PaymentDialog({ open, method, amount, partial, busy, onClose, onConfirm }: PaymentDialogProps) {
  const [received, setReceived] = useState('');

  useEffect(() => {
    if (open) setReceived('');
  }, [open]);

  const receivedKurus = parseTL(received);
  const change = receivedKurus !== null ? receivedKurus - amount : null;
  const insufficient = method === 'CASH' && receivedKurus !== null && receivedKurus < amount;

  // Hızlı nakit butonları: tam tutar ve bir üst yuvarlak banknot tutarları.
  const quick = [amount, ...[5000, 10000, 20000, 50000, 100000].map((step) => Math.ceil(amount / step) * step)]
    .filter((value, index, list) => value >= amount && list.indexOf(value) === index)
    .slice(0, 4);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title={`${PAYMENT_LABELS[method]} ödeme`}
      footer={
        <div className="flex gap-2 pb-1">
          <Button variant="outline" size="lg" className="flex-1" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant={method === 'CASH' ? 'success' : 'primary'}
            size="lg"
            className="flex-[2]"
            loading={busy}
            disabled={insufficient || amount <= 0}
            onClick={() => onConfirm(method)}
          >
            {method === 'CASH' ? 'Nakit ödemeyi kaydet' : 'Kart ödemesini kaydet'}
          </Button>
        </div>
      }
    >
      <p className="text-ink-soft">{partial ? 'Seçili ürünler' : 'Kalan tutarın tamamı'}</p>
      <p className="font-display text-5xl font-semibold tabular-nums">{formatTL(amount, { fixed: true })}</p>

      {method === 'CASH' ? (
        <div className="mt-5 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Müşteriden alınan (TL)
            <input
              type="text"
              inputMode="decimal"
              value={received}
              onChange={(event) => setReceived(event.target.value)}
              placeholder={formatTL(amount, { fixed: true }).replace(' TL', '')}
              className="h-12 rounded-lg border border-line px-3 text-lg tabular-nums focus:border-ink focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {quick.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setReceived(String(value / 100).replace('.', ','))}
                className="h-10 rounded-lg border border-line px-3 text-sm font-semibold tabular-nums hover:bg-paper"
              >
                {formatTL(value)}
              </button>
            ))}
          </div>
          {change !== null && change >= 0 ? (
            <p className="rounded-lg bg-basil-soft px-4 py-3 text-lg">
              Para üstü: <span className="font-bold tabular-nums">{formatTL(change, { fixed: true })}</span>
            </p>
          ) : null}
          {insufficient ? <p className="text-sm font-medium text-terracotta">Alınan tutar ödenecek tutardan az.</p> : null}
        </div>
      ) : (
        <p className="mt-5 rounded-lg bg-paper px-4 py-3 text-[15px]">
          Tutarı bankanın POS cihazından çekin. Onay fişi çıktıktan sonra ödemeyi kaydedin.
        </p>
      )}
    </Dialog>
  );
}
