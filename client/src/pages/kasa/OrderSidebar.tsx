import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { unitTotal, type OrderItemDTO, type PaymentMethod } from '@toscana/shared';
import { useGetMenuQuery, useGetTableOrderQuery, usePayMutation } from '../../api/api';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { OrderItemLine } from '../../components/OrderItemLine';
import { Loading } from '../../components/StateMessage';
import { TotalsSummary } from '../../components/TotalsSummary';
import { Button } from '../../components/ui/Button';
import { Stepper } from '../../components/ui/Stepper';
import { CartLineEditor } from '../../features/cart/CartLineEditor';
import { quickNotesFor } from '../../features/cart/notes';
import { cartLineTotal, useSendCart } from '../../features/cart/useSendCart';
import { setQuantity } from '../../features/cart/cartSlice';
import { clearSelection, setItemQuantity, toggleItem } from '../../features/cashier/cashierSlice';
import { pushToast } from '../../features/toast/toastSlice';
import { errorMessage } from '../../lib/errors';
import { formatTime, formatTL } from '../../lib/format';
import { useProductMap } from '../../lib/hooks';
import { MoveOrderDialog } from './MoveOrderDialog';
import { PaymentDialog } from './PaymentDialog';
import { printReceipt, Receipt } from './Receipt';
import { VoidItemDialog } from './VoidItemDialog';

function unpaidOf(item: OrderItemDTO) {
  return item.status === 'ACTIVE' ? item.quantity - item.paidQuantity : 0;
}

/** Kasa sağ paneli: gönderilmemiş ürünler, adisyon, toplamlar ve ödeme butonları. */
export function OrderSidebar({ tableId, tableName }: { tableId: number; tableName: string }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const products = useProductMap();
  const { data: menu } = useGetMenuQuery();
  const { data: order, isLoading } = useGetTableOrderQuery(tableId);
  const selectedRaw = useAppSelector((state) => state.cashier.selected);
  const pendingCart = useSendCart(tableId);
  const [pay, { isLoading: paying }] = usePayMutation();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [voidTarget, setVoidTarget] = useState<OrderItemDTO | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Adisyon değişince artık ödenemeyen seçimleri temizle.
  const selection = useMemo(() => {
    const result = new Map<number, number>();
    for (const item of order?.items ?? []) {
      const chosen = selectedRaw[String(item.id)];
      const unpaid = unpaidOf(item);
      if (chosen && unpaid > 0) result.set(item.id, Math.min(chosen, unpaid));
    }
    return result;
  }, [order, selectedRaw]);

  useEffect(() => {
    if (!order) dispatch(clearSelection());
  }, [order, dispatch]);

  const selectedTotal = useMemo(() => {
    let sum = 0;
    for (const item of order?.items ?? []) {
      const quantity = selection.get(item.id);
      if (quantity) sum += unitTotal(item.unitPrice, item.modifiers) * quantity;
    }
    return sum;
  }, [order, selection]);

  const hasSelection = selection.size > 0;
  const amountDue = hasSelection ? selectedTotal : (order?.totals.remaining ?? 0);

  function categoryNameOf(productId: number) {
    const product = products.get(productId);
    return menu?.find((c) => c.id === product?.categoryId)?.name;
  }

  async function confirmPayment(method: PaymentMethod) {
    if (!order) return;
    try {
      const result = await pay({
        orderId: order.id,
        method,
        items: hasSelection ? [...selection].map(([orderItemId, quantity]) => ({ orderItemId, quantity })) : undefined,
      }).unwrap();
      dispatch(clearSelection());
      setPaymentMethod(null);
      if (result.order.status === 'CLOSED') {
        dispatch(pushToast(`Masa ${tableName} kapatıldı`, 'success'));
        navigate('/kasa');
      } else {
        dispatch(pushToast(`${formatTL(result.payment.amount)} tahsil edildi`, 'success'));
      }
    } catch (error) {
      dispatch(pushToast(errorMessage(error), 'error'));
    }
  }

  const pendingLines = pendingCart.lines;

  return (
    <aside className="flex min-h-0 flex-col border-l border-line bg-white" aria-label={`Masa ${tableName} adisyonu`}>
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-display text-3xl font-semibold leading-none">{tableName || '…'}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {order ? `${formatTime(order.openedAt)} açıldı, ${order.openedBy}` : 'Açık hesap yok'}
          </p>
        </div>
        {order ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-paper"
            >
              İşlemler
            </button>
            {menuOpen ? (
              <div role="menu" className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-line">
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-4 py-3 text-left text-sm font-medium hover:bg-paper"
                  onClick={() => {
                    setMenuOpen(false);
                    setMoveOpen(true);
                  }}
                >
                  Masayı taşı
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-4 py-3 text-left text-sm font-medium hover:bg-paper"
                  onClick={() => {
                    setMenuOpen(false);
                    printReceipt();
                  }}
                >
                  Bilgi fişi yazdır
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5">
        {pendingLines.length > 0 ? (
          <section className="my-4 rounded-xl bg-amber-soft/60 p-3 ring-1 ring-amber/30" aria-label="Gönderilmemiş ürünler">
            <h3 className="mb-2 text-sm font-semibold text-amber">Gönderilmedi</h3>
            <ul className="flex flex-col gap-3">
              {pendingLines.map((line) => {
                const product = products.get(line.productId);
                if (!product) return null;
                return (
                  <li key={line.key} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug">{product.name}</p>
                        <p className="text-sm tabular-nums text-ink-soft">{formatTL(cartLineTotal(line, product))}</p>
                      </div>
                      <Stepper
                        size="md"
                        label={product.name}
                        value={line.quantity}
                        onIncrement={() => dispatch(setQuantity({ tableId, key: line.key, quantity: line.quantity + 1 }))}
                        onDecrement={() => dispatch(setQuantity({ tableId, key: line.key, quantity: line.quantity - 1 }))}
                      />
                    </div>
                    <CartLineEditor
                      compact
                      tableId={tableId}
                      line={line}
                      product={product}
                      quickNotes={quickNotesFor(categoryNameOf(product.id))}
                      showStepper={false}
                    />
                  </li>
                );
              })}
            </ul>
            <Button
              block
              variant="accent"
              size="lg"
              className="mt-3"
              loading={pendingCart.sending}
              disabled={!pendingCart.canSend}
              onClick={() => void pendingCart.send()}
            >
              Mutfağa gönder ({formatTL(pendingCart.total)})
            </Button>
          </section>
        ) : null}

        {isLoading ? <Loading /> : null}

        {!isLoading && !order && pendingLines.length === 0 ? (
          <p className="py-10 text-center text-ink-soft">Masa boş. Soldan ürün seçerek sipariş başlatın.</p>
        ) : null}

        {order ? (
          <ul className="divide-y divide-line">
            {order.items.map((item) => {
              const unpaid = unpaidOf(item);
              const chosen = selection.get(item.id) ?? 0;
              return (
                <li key={item.id}>
                  <OrderItemLine
                    item={item}
                    leading={
                      unpaid > 0 ? (
                        <input
                          type="checkbox"
                          className="mt-1 size-5 accent-ink"
                          checked={chosen > 0}
                          onChange={() => dispatch(toggleItem({ itemId: item.id, unpaid }))}
                          aria-label={`${item.productName} ödemeye ekle`}
                        />
                      ) : (
                        <span className="w-5" />
                      )
                    }
                    trailing={
                      unpaid > 0 ? (
                        <button
                          type="button"
                          onClick={() => setVoidTarget(item)}
                          className="text-xs font-semibold text-terracotta hover:underline"
                        >
                          İptal et
                        </button>
                      ) : null
                    }
                  />
                  {chosen > 0 && unpaid > 1 ? (
                    <div className="mb-2 ml-8 flex items-center justify-between rounded-lg bg-paper px-3 py-1.5">
                      <span className="text-sm text-ink-soft">Ödenecek adet</span>
                      <Stepper
                        size="md"
                        label={item.productName}
                        value={chosen}
                        max={unpaid}
                        onIncrement={() => dispatch(setItemQuantity({ itemId: item.id, quantity: chosen + 1 }))}
                        onDecrement={() => dispatch(setItemQuantity({ itemId: item.id, quantity: chosen - 1 }))}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {order ? (
        <div className="border-t border-line bg-paper px-5 py-4">
          <TotalsSummary order={order} large />
          {hasSelection ? (
            <div className="mt-2 flex items-center justify-between rounded-lg bg-ink px-3 py-2 text-cream">
              <span className="text-sm">Seçilen {selection.size} kalem</span>
              <span className="font-semibold tabular-nums">{formatTL(selectedTotal, { fixed: true })}</span>
              <button type="button" onClick={() => dispatch(clearSelection())} className="text-sm underline">
                Temizle
              </button>
            </div>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              size="xl"
              variant="success"
              disabled={amountDue <= 0 || paying}
              onClick={() => setPaymentMethod('CASH')}
            >
              Nakit
            </Button>
            <Button
              size="xl"
              variant="primary"
              disabled={amountDue <= 0 || paying}
              onClick={() => setPaymentMethod('CARD')}
            >
              Kart
            </Button>
          </div>
          <p className={clsx('mt-2 text-center text-xs text-ink-soft')}>
            {hasSelection ? 'Seçili ürünler ödenir, hesap açık kalır.' : 'Kalan tutarın tamamı ödenir ve masa kapanır.'}
          </p>
        </div>
      ) : null}

      {order ? <Receipt order={order} /> : null}

      <PaymentDialog
        open={paymentMethod !== null}
        method={paymentMethod ?? 'CASH'}
        amount={amountDue}
        partial={hasSelection}
        busy={paying}
        onClose={() => setPaymentMethod(null)}
        onConfirm={(method) => void confirmPayment(method)}
      />
      <VoidItemDialog item={voidTarget} onClose={() => setVoidTarget(null)} />
      {order ? (
        <MoveOrderDialog
          open={moveOpen}
          onClose={() => setMoveOpen(false)}
          orderId={order.id}
          fromTableId={tableId}
          fromTableName={tableName}
        />
      ) : null}
    </aside>
  );
}
