import { Link, useNavigate, useParams } from 'react-router';
import { useAppDispatch } from '../../app/hooks';
import { EmptyState } from '../../components/StateMessage';
import { Button } from '../../components/ui/Button';
import { Stepper } from '../../components/ui/Stepper';
import { setQuantity } from '../../features/cart/cartSlice';
import { cartLineTotal, useSendCart } from '../../features/cart/useSendCart';
import { formatTL } from '../../lib/format';
import { useProductMap } from '../../lib/hooks';
import { parseTableId, useTable } from '../../lib/tables';

export function CartPage() {
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const tableId = parseTableId(params.tableId);
  const { table } = useTable(tableId);
  const products = useProductMap();
  const { lines, itemCount, total, send, sending, canSend } = useSendCart(tableId);

  async function handleSend() {
    if (await send()) navigate('/garson');
  }

  return (
    <div className="flex flex-1 flex-col pb-28">
      <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
        <Link to={`/garson/masa/${tableId}`} className="rounded-lg px-2 py-1.5 text-sm font-semibold text-ink-soft hover:bg-ink/5">
          Menü
        </Link>
        <h1 className="text-lg font-semibold">
          <span className="font-display text-2xl">{table?.name ?? '…'}</span> sepeti
        </h1>
        <span className="w-12" />
      </div>

      {lines.length === 0 ? (
        <EmptyState title="Sepet boş">
          <p>Menüden ürün ekleyin.</p>
          <Link to={`/garson/masa/${tableId}`} className="mt-4 inline-block font-semibold text-terracotta">
            Menüye dön
          </Link>
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line bg-white">
          {lines.map((line) => {
            const product = products.get(line.productId);
            const modifiers = product?.modifiers.filter((m) => line.modifierIds.includes(m.id)) ?? [];
            return (
              <li key={line.key} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{product?.name ?? 'Ürün'}</p>
                  {modifiers.map((m) => (
                    <p key={m.id} className="text-sm font-medium text-olive">
                      + {m.name}
                    </p>
                  ))}
                  {line.note ? (
                    <p className="mt-1 inline-block rounded bg-amber-soft px-2 py-0.5 text-sm font-semibold text-amber">{line.note}</p>
                  ) : null}
                  {product && !product.isAvailable ? <p className="mt-1 text-sm font-semibold text-terracotta">Tükendi</p> : null}
                  <p className="mt-1 text-sm tabular-nums text-ink-soft">{formatTL(cartLineTotal(line, product))}</p>
                </div>
                <Stepper
                  label={product?.name ?? 'Ürün'}
                  value={line.quantity}
                  onIncrement={() => dispatch(setQuantity({ tableId, key: line.key, quantity: line.quantity + 1 }))}
                  onDecrement={() => dispatch(setQuantity({ tableId, key: line.key, quantity: line.quantity - 1 }))}
                />
              </li>
            );
          })}
        </ul>
      )}

      {itemCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-line bg-white px-4 pt-3 shadow-[0_-4px_16px_rgba(31,42,48,0.08)] pb-safe">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <span className="block text-sm text-ink-soft">{itemCount} ürün</span>
              <span className="block text-lg font-semibold tabular-nums">{formatTL(total)}</span>
            </div>
            <Button size="xl" variant="accent" onClick={() => void handleSend()} loading={sending} disabled={!canSend}>
              Mutfağa gönder
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
