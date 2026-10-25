import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useGetAreasQuery } from '../../api/api';
import { useAppSelector } from '../../app/hooks';
import { ErrorState, Loading } from '../../components/StateMessage';
import { TableTile } from '../../components/TableTile';
import { errorMessage } from '../../lib/errors';
import { useNow } from '../../lib/hooks';

const AREA_KEY = 'toscana.waiter.area';

export function TablesPage() {
  const navigate = useNavigate();
  const now = useNow();
  const { data: areas, isLoading, isError, error, refetch } = useGetAreasQuery();
  const drafts = useAppSelector((state) => state.cart.byTable);
  const [areaId, setAreaId] = useState<number | null>(() => {
    try {
      const saved = Number(sessionStorage.getItem(AREA_KEY));
      return Number.isInteger(saved) && saved > 0 ? saved : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!areas || areas.length === 0) return;
    if (areaId === null || !areas.some((area) => area.id === areaId)) setAreaId(areas[0].id);
  }, [areas, areaId]);

  function chooseArea(id: number) {
    setAreaId(id);
    try {
      sessionStorage.setItem(AREA_KEY, String(id));
    } catch {
      // depolama kapalıysa geç
    }
  }

  if (isLoading) return <Loading />;
  if (isError || !areas) return <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />;

  const area = areas.find((a) => a.id === areaId) ?? areas[0];

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-14 z-20 bg-neutral-50 px-4 pb-3 pt-4">
        <div className="grid grid-flow-col gap-1 rounded-xl bg-ink/6 p-1" role="tablist" aria-label="Alanlar">
          {areas.map((a) => {
            const occupied = a.tables.filter((t) => t.orderId !== null).length;
            const active = a.id === area?.id;
            return (
              <button
                key={a.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => chooseArea(a.id)}
                className={clsx(
                  'flex h-11 items-center justify-center gap-2 rounded-lg text-[15px] font-semibold transition-colors',
                  active ? 'bg-white text-ink shadow-sm' : 'text-ink-soft',
                )}
              >
                {a.name}
                {occupied > 0 ? (
                  <span className="rounded-full bg-terracotta px-1.5 text-xs font-semibold text-white tabular-nums">
                    {occupied}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {area ? (
        <div className="grid grid-cols-3 gap-3 px-4 pb-8" role="tabpanel" aria-label={area.name}>
          {area.tables.map((table) => (
            <TableTile
              key={table.id}
              table={table}
              now={now}
              hasDraft={(drafts[String(table.id)]?.length ?? 0) > 0}
              onSelect={() => navigate(`masa/${table.id}`)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
