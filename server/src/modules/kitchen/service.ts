import type { TicketDTO } from '@toscana/shared';
import { prisma } from '../../db.js';
import { notFound } from '../../lib/httpError.js';
import { emit } from '../../socket.js';
import { loadTicketDTOs } from './dto.js';

export function listOpenTickets(): Promise<TicketDTO[]> {
  return loadTicketDTOs(prisma, { completedAt: null });
}

/** Aşçı "Tamamla"ya bastı: kart ekrandan kalkar, siparişi giren kişiye "hazır" bildirimi gider. */
export async function completeTicket(ticketId: number): Promise<{ ok: true }> {
  const ticket = await prisma.kitchenTicket.findUnique({
    where: { id: ticketId },
    include: { order: { select: { table: { select: { name: true } } } } },
  });
  if (!ticket) throw notFound('TICKET_NOT_FOUND', 'Mutfak kartı bulunamadı');

  if (!ticket.completedAt) {
    await prisma.kitchenTicket.update({ where: { id: ticketId }, data: { completedAt: new Date() } });
    emit.ticketCompleted({ ticketId, tableName: ticket.order.table.name }, ticket.createdById);
  }
  return { ok: true };
}
