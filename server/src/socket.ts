import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import {
  ROOMS,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type OrderDTO,
  type TableSummaryDTO,
  type TicketDTO,
} from '@toscana/shared';
import { verifyToken, type AuthStaff } from './middleware/auth.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface InterServerEvents {}

interface SocketData {
  staff: AuthStaff;
}

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

let io: AppServer | null = null;

export function initSocket(httpServer: HttpServer): AppServer {
  const server: AppServer = new Server(httpServer, {
    serveClient: false,
    pingInterval: 10_000,
    pingTimeout: 8_000,
  });

  server.use((socket, next) => {
    const token: unknown = socket.handshake.auth?.token;
    if (typeof token !== 'string' || token.length === 0) {
      next(new Error('UNAUTHORIZED'));
      return;
    }
    try {
      socket.data.staff = verifyToken(token);
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  server.on('connection', (socket) => {
    const staff = socket.data.staff;
    void socket.join(ROOMS.staff(staff.id));
    if (staff.role === 'KITCHEN') void socket.join(ROOMS.kitchen);
    else if (staff.role === 'WAITER') void socket.join(ROOMS.waiters);
    else void socket.join(ROOMS.cashier);
  });

  io = server;
  return server;
}

function getIO(): AppServer {
  if (!io) throw new Error('Socket.io başlatılmadı');
  return io;
}

/** REST işlemi veritabanına yazıldıktan sonra ilgili ekranlara yayın yapar. */
export const emit = {
  ticketCreated(ticket: TicketDTO) {
    getIO().to(ROOMS.kitchen).emit('ticketCreated', ticket);
  },
  ticketCompleted(payload: { ticketId: number; tableName: string }, createdById: number) {
    getIO().to([ROOMS.kitchen, ROOMS.staff(createdById)]).emit('ticketCompleted', payload);
  },
  ticketItemVoided(payload: { ticketId: number; orderItemId: number; quantity: number }) {
    getIO().to(ROOMS.kitchen).emit('ticketItemVoided', payload);
  },
  orderUpdated(order: OrderDTO) {
    getIO().to([ROOMS.cashier, ROOMS.waiters]).emit('orderUpdated', order);
  },
  tableUpdated(tables: TableSummaryDTO[]) {
    // Mutfak da dinler: masa taşınınca kartlardaki masa adı güncellensin.
    getIO().to([ROOMS.cashier, ROOMS.waiters, ROOMS.kitchen]).emit('tableUpdated', tables);
  },
  menuUpdated(payload: { productId: number; isAvailable: boolean }) {
    getIO().emit('menuUpdated', payload);
  },
};

export function closeSocket(): Promise<void> {
  return new Promise((resolve) => {
    if (!io) {
      resolve();
      return;
    }
    void io.close(() => resolve());
  });
}
