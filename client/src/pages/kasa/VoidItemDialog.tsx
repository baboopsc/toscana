import clsx from 'clsx';
import { useEffect, useState } from 'react';
import type { OrderItemDTO } from '@toscana/shared';
import { useVoidItemMutation } from '../../api/api';
import { useAppDispatch } from '../../app/hooks';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Stepper } from '../../components/ui/Stepper';
import { pushToast } from '../../features/toast/toastSlice';
import { errorMessage } from '../../lib/errors';

const REASONS = ['Yanlış giriş', 'Müşteri vazgeçti', 'Mutfak hatası', 'Ürün kalmadı'];

/** Kalem iptali: adet ve sebep sorulur, ödenmiş adetler iptal edilemez. */
export function VoidItemDialog({ item, onClose }: { item: OrderItemDTO | null; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [voidItem, { isLoading }] = useVoidItemMutation();
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');

  const unpaid = item ? item.quantity - item.paidQuantity : 0;

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity - item.paidQuantity);
      setReason('');
    }
  }, [item]);

  async function confirm() {
    if (!item) return;
    try {
      await voidItem({ itemId: item.id, quantity, reason: reason.trim() }).unwrap();
      dispatch(pushToast(`${quantity} × ${item.productName} iptal edildi`, 'info'));
      onClose();
    } catch (error) {
      dispatch(pushToast(errorMessage(error), 'error'));
    }
  }

  return (
    <Dialog
      open={item !== null}
      onClose={onClose}
      size="sm"
      title="Kalemi iptal et"
      footer={
        <div className="flex gap-2 pb-1">
          <Button variant="outline" size="lg" className="flex-1" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="accent"
            size="lg"
            className="flex-[2]"
            loading={isLoading}
            disabled={reason.trim().length < 3 || quantity < 1}
            onClick={() => void confirm()}
          >
            İptal et
          </Button>
        </div>
      }
    >
      {item ? (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-lg font-semibold">{item.productName}</p>
            {item.paidQuantity > 0 ? (
              <p className="text-sm text-ink-soft">
                {item.paidQuantity} adedi ödendi, en fazla {unpaid} adet iptal edilebilir.
              </p>
            ) : null}
          </div>

          {unpaid > 1 ? (
            <div className="flex items-center justify-between">
              <span className="font-medium">İptal edilecek adet</span>
              <Stepper
                label={item.productName}
                value={quantity}
                max={unpaid}
                onIncrement={() => setQuantity((q) => Math.min(unpaid, q + 1))}
                onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <span className="font-medium">Sebep</span>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={reason === option}
                  onClick={() => setReason(option)}
                  className={clsx(
                    'h-9 rounded-full border px-3 text-sm font-medium',
                    reason === option ? 'border-terracotta bg-terracotta-soft text-terracotta' : 'border-line',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={reason}
              maxLength={120}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ya da sebebi yazın"
              className="h-11 rounded-lg border border-line px-3 focus:border-ink focus:outline-none"
            />
          </div>
          <p className="text-sm text-ink-soft">Ürün mutfağa gönderildiyse kartında üstü çizili görünür.</p>
        </div>
      ) : null}
    </Dialog>
  );
}
