import type { OrderDTO, TableSummaryDTO, TicketDTO } from './types.js';

// Socket.io event adları tek yerde. Sunucu yayınlar, istemci sadece dinler.

export interface ServerToClientEvents {
  ticketCreated: (ticket: TicketDTO) => void;
  ticketCompleted: (payload: { ticketId: number; tableName: string }) => void;
  ticketItemVoided: (payload: { ticketId: number; orderItemId: number; quantity: number }) => void;
  orderUpdated: (order: OrderDTO) => void;
  tableUpdated: (tables: TableSummaryDTO[]) => void;
  menuUpdated: (payload: { productId: number; isAvailable: boolean }) => void;
}

// İstemci sunucuya socket event'i göndermez; tüm değişiklikler REST ile yapılır.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ClientToServerEvents {}

export const ROOMS = {
  kitchen: 'kitchen',
  cashier: 'cashier',
  waiters: 'waiters',
  staff: (id: number) => `staff:${id}`,
} as const;
