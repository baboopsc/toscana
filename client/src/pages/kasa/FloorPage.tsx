import { useNavigate } from 'react-router';
import { useGetAreasQuery } from '../../api/api';
import { ErrorState, Loading } from '../../components/StateMessage';
import { TableTile } from '../../components/TableTile';
import { errorMessage } from '../../lib/errors';
import { formatTL } from '../../lib/format';
import { useNow } from '../../lib/hooks';

/** Kasa: masa planı. Dolu masalar tutar ve süreyle görünür. */
export function FloorPage() {
  const navigate = useNavigate();
  const now = useNow();
  const { data: areas, isLoading, isError, error, refetch } = useGetAreasQuery();

  if (isLoading) return <Loading />;
  if (isError || !areas) return <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />;

  const tables = areas.flatMap((area) => area.tables);
  const occupied = tables.filter((table) => table.orderId !== null);
  const openTotal = occupied.reduce((sum, table) => sum + table.total, 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-4xl font-semibold">Masa planı</h1>
          <p className="text-ink-soft">
            <span className="font-semibold text-ink tabular-nums">{occupied.length}</span> / {tables.length} masa dolu, açık
            hesaplar toplamı <span className="font-semibold text-ink tabular-nums">{formatTL(openTotal)}</span>
          </p>
        </div>

        {areas.map((area) => (
          <section key={area.id} aria-labelledby={`area-${area.id}`}>
            <h2 id={`area-${area.id}`} className="mb-3 text-lg font-semibold">
              {area.name}
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3">
              {area.tables.map((table) => (
                <TableTile
                  key={table.id}
                  table={table}
                  now={now}
                  size="lg"
                  onSelect={() => navigate(`/kasa/masa/${table.id}`)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
