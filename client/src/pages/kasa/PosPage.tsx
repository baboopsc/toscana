import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useGetMenuQuery, useSetAvailabilityMutation } from '../../api/api';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { ErrorState, Loading } from '../../components/StateMessage';
import { Badge } from '../../components/ui/Badge';
import { incrementProduct, selectCartLines } from '../../features/cart/cartSlice';
import { openTable, setAvailabilityMode } from '../../features/cashier/cashierSlice';
import { pushToast } from '../../features/toast/toastSlice';
import { errorMessage } from '../../lib/errors';
import { formatTL } from '../../lib/format';
import { parseTableId, useTable } from '../../lib/tables';
import { OrderSidebar } from './OrderSidebar';

/** Kasa: solda kategori butonları ve sade ürün kartları, sağda masanın adisyonu. */
export function PosPage() {
  const params = useParams();
  const dispatch = useAppDispatch();
  const tableId = parseTableId(params.tableId);
  const { table, areaName } = useTable(tableId);
  const { data: menu, isLoading, isError, error, refetch } = useGetMenuQuery();
  const availabilityMode = useAppSelector((state) => state.cashier.availabilityMode);
  const pending = useAppSelector((state) => selectCartLines(state, tableId));
  const [setAvailability] = useSetAvailabilityMutation();
  const [categoryId, setCategoryId] = useState<number | null>(null);

  useEffect(() => {
    if (tableId) dispatch(openTable(tableId));
  }, [dispatch, tableId]);

  useEffect(() => {
    if (menu && menu.length > 0 && (categoryId === null || !menu.some((c) => c.id === categoryId))) {
      setCategoryId(menu[0].id);
    }
  }, [menu, categoryId]);

  if (tableId === 0) return <ErrorState message="Geçersiz masa" />;

  const category = menu?.find((c) => c.id === categoryId) ?? menu?.[0];

  async function toggleAvailability(productId: number, isAvailable: boolean, name: string) {
    try {
      await setAvailability({ productId, isAvailable }).unwrap();
      dispatch(pushToast(isAvailable ? `${name} tekrar satışta` : `${name} tükendi olarak işaretlendi`, 'info'));
    } catch (err) {
      dispatch(pushToast(errorMessage(err), 'error'));
    }
  }

  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_380px]">
      <section className="flex min-h-0 flex-col">
        <div className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-4">
          <Link to="/kasa" className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-paper">
            Masa planı
          </Link>
          <div>
            <p className="text-sm text-ink-soft">{areaName ?? ''}</p>
            <h1 className="font-display text-4xl font-semibold leading-none">{table?.name ?? '…'}</h1>
          </div>
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="size-4 accent-terracotta"
              checked={availabilityMode}
              onChange={(event) => dispatch(setAvailabilityMode(event.target.checked))}
            />
            Tükendi düzenle
          </label>
        </div>

        {isLoading ? <Loading label="Menü yükleniyor" /> : null}
        {isError ? <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} /> : null}

        {menu && category ? (
          <>
            <div className="flex flex-wrap gap-2 px-6 pt-4" role="tablist" aria-label="Kategoriler">
              {menu.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={c.id === category.id}
                  onClick={() => setCategoryId(c.id)}
                  className={clsx(
                    'h-12 rounded-xl px-5 text-base font-semibold transition-colors',
                    c.id === category.id ? 'bg-ink text-cream' : 'bg-white text-ink ring-1 ring-line hover:ring-ink/40',
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {availabilityMode ? (
              <p className="mx-6 mt-4 rounded-lg bg-amber-soft px-4 py-2 text-sm font-medium text-amber">
                Ürüne dokunmak satış durumunu değiştirir. Sipariş eklemek için “Tükendi düzenle”yi kapatın.
              </p>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
                {category.products.map((product) => {
                  const inCart = pending
                    .filter((line) => line.productId === product.id)
                    .reduce((sum, line) => sum + line.quantity, 0);
                  const soldOut = !product.isAvailable;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        if (availabilityMode) void toggleAvailability(product.id, soldOut, product.name);
                        else if (!soldOut) dispatch(incrementProduct({ tableId, productId: product.id }));
                      }}
                      disabled={!availabilityMode && soldOut}
                      className={clsx(
                        'relative flex min-h-24 flex-col justify-between rounded-xl p-3 text-left ring-1 transition-colors',
                        soldOut ? 'bg-ink/5 text-ink-soft ring-line' : 'bg-white ring-line hover:ring-ink/50',
                        availabilityMode && 'ring-2 ring-amber/40',
                      )}
                    >
                      <span className="font-semibold leading-snug">{product.name}</span>
                      <span className="mt-2 flex items-center justify-between gap-2">
                        <span className="tabular-nums">{formatTL(product.price)}</span>
                        <span className="flex gap-1">
                          {product.isNew ? <Badge tone="new">YENİ</Badge> : null}
                          {soldOut ? <Badge tone="void">Tükendi</Badge> : null}
                        </span>
                      </span>
                      {inCart > 0 ? (
                        <span className="absolute -right-1.5 -top-1.5 grid size-7 place-items-center rounded-full bg-terracotta text-sm font-bold text-white tabular-nums">
                          {inCart}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </section>

      <OrderSidebar tableId={tableId} tableName={table?.name ?? ''} />
    </div>
  );
}
