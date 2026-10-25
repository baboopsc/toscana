import { useState } from 'react';
import { api, useCompleteTicketMutation, useGetTicketsQuery } from '../../api/api';
import { useAppDispatch } from '../../app/hooks';
import { EmptyState, ErrorState, Loading } from '../../components/StateMessage';
import { pushToast } from '../../features/toast/toastSlice';
import { errorMessage } from '../../lib/errors';
import { useNow, useServerOffset } from '../../lib/hooks';
import { TicketCard } from './TicketCard';

/** Mutfak panosu: en eski kart sol üstte. Yeni kartlar sayfa yenilenmeden düşer. */
export function KitchenBoardPage() {
  const dispatch = useAppDispatch();
  const offset = useServerOffset();
  const now = useNow(15_000) + offset;
  const { data: tickets, isLoading, isError, error, refetch } = useGetTicketsQuery(undefined, {
    pollingInterval: 60_000,
  });
  const [completeTicket] = useCompleteTicketMutation();
  const [completing, setCompleting] = useState<number | null>(null);

  async function complete(ticketId: number) {
    setCompleting(ticketId);
    const patch = dispatch(
      api.util.updateQueryData('getTickets', undefined, (draft) => draft.filter((t) => t.id !== ticketId)),
    );
    try {
      await completeTicket(ticketId).unwrap();
    } catch (err) {
      patch.undo();
      dispatch(pushToast(errorMessage(err), 'error'));
    } finally {
      setCompleting(null);
    }
  }

  if (isLoading) return <Loading label="Siparişler yükleniyor" />;
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />;
  if (!tickets || tickets.length === 0) {
    return (
      <EmptyState title="Bekleyen sipariş yok">
        <p>Garson sipariş gönderdiğinde kart burada belirir.</p>
      </EmptyState>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] items-start gap-4">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          now={now}
          completing={completing === ticket.id}
          onComplete={() => void complete(ticket.id)}
        />
      ))}
    </div>
  );
}
