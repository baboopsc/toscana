import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@toscana/shared';
import { store } from '../app/store';
import { logout } from '../features/auth/authSlice';
import { setConnectionStatus } from '../features/connection/connectionSlice';
import { pushToast } from '../features/toast/toastSlice';
import { playNewTicketSound } from '../lib/sound';
import { api } from './api';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;
let socketToken: string | null = null;

function role() {
  return store.getState().auth.staff?.role;
}

/** Giriş yapılınca bağlanır; aynı token ile tekrar çağrılırsa mevcut bağlantıyı kullanır. */
export function connectSocket(token: string): void {
  if (socket && socketToken === token) return;
  disconnectSocket();

  socketToken = token;
  const s: AppSocket = io({ auth: { token }, transports: ['websocket', 'polling'] });
  socket = s;
  let hasConnected = false;

  store.dispatch(setConnectionStatus('connecting'));

  s.on('connect', () => {
    store.dispatch(setConnectionStatus('online'));
    // Kopukken kaçan değişiklikleri REST'ten yeniden çek.
    if (hasConnected) store.dispatch(api.util.invalidateTags(['Menu', 'Areas', 'Order', 'Tickets']));
    hasConnected = true;
  });

  s.on('disconnect', () => {
    store.dispatch(setConnectionStatus('offline'));
  });

  s.on('connect_error', (error) => {
    if (error.message === 'UNAUTHORIZED') {
      store.dispatch(logout());
      return;
    }
    store.dispatch(setConnectionStatus('offline'));
  });

  s.on('ticketCreated', (ticket) => {
    store.dispatch(
      api.util.updateQueryData('getTickets', undefined, (draft) => {
        if (!draft.some((t) => t.id === ticket.id)) draft.push(ticket);
      }),
    );
    if (role() === 'KITCHEN') playNewTicketSound();
  });

  s.on('ticketCompleted', ({ ticketId, tableName }) => {
    store.dispatch(
      api.util.updateQueryData('getTickets', undefined, (draft) => draft.filter((t) => t.id !== ticketId)),
    );
    if (role() !== 'KITCHEN') {
      store.dispatch(pushToast(`Masa ${tableName} hazır, servise alabilirsiniz`, 'success'));
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch {
        // titreşim desteklenmiyorsa geç
      }
    }
  });

  s.on('ticketItemVoided', () => {
    store.dispatch(api.util.invalidateTags(['Tickets']));
  });

  s.on('orderUpdated', (order) => {
    store.dispatch(
      api.util.updateQueryData('getTableOrder', order.tableId, () => (order.status === 'OPEN' ? order : null)),
    );
  });

  s.on('tableUpdated', (tables) => {
    store.dispatch(
      api.util.updateQueryData('getAreas', undefined, (draft) => {
        for (const area of draft) {
          area.tables = area.tables.map((table) => tables.find((t) => t.id === table.id) ?? table);
        }
      }),
    );
    for (const table of tables) {
      if (table.orderId === null) {
        store.dispatch(api.util.updateQueryData('getTableOrder', table.id, () => null));
      }
    }
    if (role() === 'KITCHEN') store.dispatch(api.util.invalidateTags(['Tickets']));
  });

  s.on('menuUpdated', ({ productId, isAvailable }) => {
    store.dispatch(
      api.util.updateQueryData('getMenu', undefined, (draft) => {
        for (const category of draft) {
          for (const product of category.products) {
            if (product.id === productId) product.isAvailable = isAvailable;
          }
        }
      }),
    );
  });
}

export function disconnectSocket(): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  socketToken = null;
  store.dispatch(setConnectionStatus('idle'));
}
