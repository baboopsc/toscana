import type { TicketDTO } from '@toscana/shared';
import type { Db } from '../../db.js';

const ticketInclude = {
  order: { select: { table: { select: { name: true } } } },
  createdBy: { select: { name: true } },
  items: {
    orderBy: { id: 'asc' as const },
    include: { modifiers: { orderBy: { id: 'asc' as const } } },
  },
};

/** Mutfak kartlarını yükler; "2. tur" bilgisi aynı adisyondaki önceki kartlardan hesaplanır. */
export async function loadTicketDTOs(
  db: Db,
  where: { id?: number; completedAt?: null },
): Promise<TicketDTO[]> {
  const tickets = await db.kitchenTicket.findMany({
    where,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    include: ticketInclude,
  });
  if (tickets.length === 0) return [];

  const orderIds = [...new Set(tickets.map((ticket) => ticket.orderId))];
  const siblings = await db.kitchenTicket.findMany({
    where: { orderId: { in: orderIds } },
    select: { id: true, orderId: true },
    orderBy: { id: 'asc' },
  });
  const idsByOrder = new Map<number, number[]>();
  for (const sibling of siblings) {
    const list = idsByOrder.get(sibling.orderId) ?? [];
    list.push(sibling.id);
    idsByOrder.set(sibling.orderId, list);
  }

  return tickets.map((ticket) => ({
    id: ticket.id,
    orderId: ticket.orderId,
    tableName: ticket.order.table.name,
    waiterName: ticket.createdBy.name,
    createdAt: ticket.createdAt.toISOString(),
    round: (idsByOrder.get(ticket.orderId) ?? []).indexOf(ticket.id) + 1,
    items: ticket.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      modifiers: item.modifiers.map((modifier) => ({ name: modifier.name, price: modifier.price })),
      note: item.note,
      status: item.status,
    })),
  }));
}
