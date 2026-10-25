import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { CategoryDTO, ProductDTO } from '@toscana/shared';
import { useGetMenuQuery, useGetTableOrderQuery } from '../../api/api';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { ErrorState, Loading } from '../../components/StateMessage';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Stepper } from '../../components/ui/Stepper';
import { CartLineEditor } from '../../features/cart/CartLineEditor';
import { addLine, incrementProduct, selectCartLines, setQuantity, type CartLine } from '../../features/cart/cartSlice';
import { quickNotesFor } from '../../features/cart/notes';
import { useSendCart } from '../../features/cart/useSendCart';
import { errorMessage } from '../../lib/errors';
import { formatTL } from '../../lib/format';
import { parseTableId, useTable } from '../../lib/tables';

function ProductRow({
  tableId,
  product,
  category,
  lines,
}: {
  tableId: number;
  product: ProductDTO;
  category: CategoryDTO;
  lines: CartLine[];
}) {
  const dispatch = useAppDispatch();
  const [first, ...extra] = lines;
  const quantity = first?.quantity ?? 0;
  const soldOut = !product.isAvailable;
  const quickNotes = quickNotesFor(category.name);

  return (
    <li className={clsx('px-4 py-3', soldOut && 'opacity-55')}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[17px] font-semibold leading-snug">{product.name}</span>
            {product.isNew ? <Badge tone="new">YENİ</Badge> : null}
            {soldOut ? <Badge tone="void">Tükendi</Badge> : null}
          </div>
          <div className="mt-0.5 text-[15px] font-medium tabular-nums text-ink-soft">{formatTL(product.price)}</div>
          {product.description ? <p className="mt-0.5 line-clamp-1 text-[13px] text-ink-soft">{product.description}</p> : null}
        </div>
        <Stepper
          label={product.name}
          value={quantity}
          disabled={soldOut}
          onIncrement={() => dispatch(incrementProduct({ tableId, productId: product.id }))}
          onDecrement={() => first && dispatch(setQuantity({ tableId, key: first.key, quantity: first.quantity - 1 }))}
        />
      </div>

      {first ? (
        <div className="mt-3 flex flex-col gap-2">
          <CartLineEditor tableId={tableId} line={first} product={product} quickNotes={quickNotes} showStepper={false} />
          {extra.map((line) => (
            <CartLineEditor key={line.key} tableId={tableId} line={line} product={product} quickNotes={quickNotes} showStepper />
          ))}
          <button
            type="button"
            onClick={() => dispatch(addLine({ tableId, productId: product.id }))}
            disabled={soldOut}
            className="self-start rounded-lg px-2 py-1.5 text-sm font-semibold text-olive hover:bg-olive-soft"
          >
            + Aynı üründen farklı notla ekle
          </button>
        </div>
      ) : null}
    </li>
  );
}

export function OrderPage() {
  const params = useParams();
  const navigate = useNavigate();
  const tableId = parseTableId(params.tableId);
  const { table } = useTable(tableId);
  const { data: menu, isLoading, isError, error, refetch } = useGetMenuQuery();
  const { data: order } = useGetTableOrderQuery(tableId, { skip: tableId === 0 });
  const lines = useAppSelector((state) => selectCartLines(state, tableId));
  const { itemCount, total, send, sending, canSend } = useSendCart(tableId);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  useEffect(() => {
    if (menu && menu.length > 0 && (categoryId === null || !menu.some((c) => c.id === categoryId))) {
      setCategoryId(menu[0].id);
    }
  }, [menu, categoryId]);

  if (tableId === 0) return <ErrorState message="Geçersiz masa" />;
  if (isLoading) return <Loading label="Menü yükleniyor" />;
  if (isError || !menu) return <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />;

  const category = menu.find((c) => c.id === categoryId) ?? menu[0];

  async function handleSend() {
    if (await send()) navigate('/garson');
  }

  return (
    <div className="flex flex-1 flex-col pb-28">
      <div className="flex items-center justify-between gap-3 bg-white px-4 pb-2 pt-3">
        <Link to="/garson" className="rounded-lg px-2 py-1.5 text-sm font-semibold text-ink-soft hover:bg-ink/5">
          Masalar
        </Link>
        <h1 className="font-display text-3xl font-semibold leading-none">{table?.name ?? '…'}</h1>
        <Link
          to={`/garson/masa/${tableId}/hesap`}
          className="rounded-lg px-2 py-1.5 text-right text-sm font-semibold text-ink-soft hover:bg-ink/5"
        >
          Hesap
          {order ? <span className="block text-xs font-medium tabular-nums">{formatTL(order.totals.gross)}</span> : null}
        </Link>
      </div>

      <nav
        className="no-scrollbar sticky top-14 z-20 flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-2"
        aria-label="Kategoriler"
      >
        {menu.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryId(c.id)}
            aria-pressed={c.id === category?.id}
            className={clsx(
              'h-10 shrink-0 rounded-full px-4 text-[15px] font-semibold transition-colors',
              c.id === category?.id ? 'bg-ink text-cream' : 'bg-ink/6 text-ink',
            )}
          >
            {c.name}
          </button>
        ))}
      </nav>

      {category ? (
        <ul className="divide-y divide-line bg-white">
          {category.products.map((product) => (
            <ProductRow
              key={product.id}
              tableId={tableId}
              product={product}
              category={category}
              lines={lines.filter((line) => line.productId === product.id)}
            />
          ))}
        </ul>
      ) : null}

      {itemCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-line bg-white px-4 pt-3 shadow-[0_-4px_16px_rgba(31,42,48,0.08)] pb-safe">
          <div className="flex items-center gap-3">
            <Link to={`/garson/masa/${tableId}/sepet`} className="min-w-0 flex-1 rounded-lg px-1 py-1 hover:bg-ink/5">
              <span className="block text-sm text-ink-soft">Sepet, {itemCount} ürün</span>
              <span className="block text-lg font-semibold tabular-nums">{formatTL(total)}</span>
            </Link>
            <Button size="xl" variant="accent" onClick={() => void handleSend()} loading={sending} disabled={!canSend}>
              Mutfağa gönder
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
