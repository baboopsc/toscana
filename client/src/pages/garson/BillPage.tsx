import { Link, useParams } from 'react-router';
import { useGetTableOrderQuery } from '../../api/api';
import { OrderItemLine } from '../../components/OrderItemLine';
import { EmptyState, ErrorState, Loading } from '../../components/StateMessage';
import { TotalsSummary } from '../../components/TotalsSummary';
import { errorMessage } from '../../lib/errors';
import { formatTime } from '../../lib/format';
import { parseTableId, useTable } from '../../lib/tables';

/** Garsonun masadaki güncel hesabı görmesi için (salt okunur). */
export function BillPage() {
  const params = useParams();
  const tableId = parseTableId(params.tableId);
  const { table } = useTable(tableId);
  const { data: order, isLoading, isError, error, refetch } = useGetTableOrderQuery(tableId, { skip: tableId === 0 });

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
        <Link to={`/garson/masa/${tableId}`} className="rounded-lg px-2 py-1.5 text-sm font-semibold text-ink-soft hover:bg-ink/5">
          Menü
        </Link>
        <h1 className="text-lg font-semibold">
          <span className="font-display text-2xl">{table?.name ?? '…'}</span> hesabı
        </h1>
        <span className="w-12" />
      </div>

      {isLoading ? <Loading /> : null}
      {isError ? <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && !order ? (
        <EmptyState title="Açık hesap yok">
          <p>Bu masaya henüz sipariş girilmedi.</p>
        </EmptyState>
      ) : null}

      {order ? (
        <div className="flex flex-col gap-4 bg-white px-4 pb-8">
          <p className="text-sm text-ink-soft">
            {formatTime(order.openedAt)} saatinde {order.openedBy} açtı
          </p>
          <div className="divide-y divide-line">
            {order.items.map((item) => (
              <OrderItemLine key={item.id} item={item} />
            ))}
          </div>
          <TotalsSummary order={order} />
          <p className="text-sm text-ink-soft">Ödeme kasada alınır.</p>
        </div>
      ) : null}
    </div>
  );
}
