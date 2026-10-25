import { useNavigate } from 'react-router';
import { useGetAreasQuery, useMoveOrderMutation } from '../../api/api';
import { useAppDispatch } from '../../app/hooks';
import { Dialog } from '../../components/ui/Dialog';
import { pushToast } from '../../features/toast/toastSlice';
import { errorMessage } from '../../lib/errors';

interface MoveOrderDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: number;
  fromTableId: number;
  fromTableName: string;
}

/** Açık hesabı boş bir masaya taşır. */
export function MoveOrderDialog({ open, onClose, orderId, fromTableId, fromTableName }: MoveOrderDialogProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: areas } = useGetAreasQuery();
  const [moveOrder, { isLoading }] = useMoveOrderMutation();

  async function move(targetTableId: number, targetName: string) {
    try {
      await moveOrder({ orderId, fromTableId, targetTableId }).unwrap();
      dispatch(pushToast(`${fromTableName} hesabı ${targetName} masasına taşındı`, 'success'));
      onClose();
      navigate(`/kasa/masa/${targetTableId}`);
    } catch (error) {
      dispatch(pushToast(errorMessage(error), 'error'));
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={`${fromTableName} hesabını taşı`} size="lg">
      <p className="mb-4 text-ink-soft">Yalnızca boş masalar listelenir.</p>
      <div className="flex flex-col gap-5">
        {(areas ?? []).map((area) => {
          const empty = area.tables.filter((table) => table.orderId === null && table.id !== fromTableId);
          return (
            <section key={area.id}>
              <h3 className="mb-2 font-semibold">{area.name}</h3>
              {empty.length === 0 ? (
                <p className="text-sm text-ink-soft">Boş masa yok.</p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
                  {empty.map((table) => (
                    <button
                      key={table.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => void move(table.id, table.name)}
                      className="h-16 rounded-xl border border-line font-display text-2xl font-semibold hover:border-ink disabled:opacity-50"
                    >
                      {table.name}
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </Dialog>
  );
}
