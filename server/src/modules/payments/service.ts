import { unitTotal, type PayRequest, type PayResponse } from '@toscana/shared';
import { prisma } from '../../db.js';
import { badRequest, conflict, notFound } from '../../lib/httpError.js';
import type { AuthStaff } from '../../middleware/auth.js';
import { emit } from '../../socket.js';
import { loadOrderDTO, settleOrder } from '../orders/dto.js';
import { getTableSummaries } from '../tables/service.js';

/**
 * Ödeme alır. "items" yoksa kalan tüm ödenmemiş adetler ödenir (Hesabı Kapat).
 * Tutar her zaman sunucuda, veritabanındaki anlık fiyatlardan hesaplanır.
 */
export async function pay(orderId: number, staff: AuthStaff, body: PayRequest): Promise<PayResponse> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { where: { status: 'ACTIVE' }, include: { modifiers: true } } },
  });
  if (!order) throw notFound('ORDER_NOT_FOUND', 'Adisyon bulunamadı');
  if (order.status !== 'OPEN') throw conflict('ORDER_CLOSED', 'Bu adisyon kapanmış');

  const itemsById = new Map(order.items.map((item) => [item.id, item]));
  let lines: { item: (typeof order.items)[number]; quantity: number }[];

  if (!body.items || body.items.length === 0) {
    lines = order.items
      .filter((item) => item.quantity > item.paidQuantity)
      .map((item) => ({ item, quantity: item.quantity - item.paidQuantity }));
  } else {
    const merged = new Map<number, number>();
    for (const line of body.items) {
      merged.set(line.orderItemId, (merged.get(line.orderItemId) ?? 0) + line.quantity);
    }
    lines = [...merged].map(([orderItemId, quantity]) => {
      const item = itemsById.get(orderItemId);
      if (!item) throw badRequest('ITEM_NOT_IN_ORDER', 'Seçilen kalem bu adisyonda yok ya da iptal edilmiş');
      const unpaid = item.quantity - item.paidQuantity;
      if (quantity > unpaid) {
        throw conflict('QUANTITY_EXCEEDS_UNPAID', `${item.productName}: en fazla ${unpaid} adet ödenebilir`);
      }
      return { item, quantity };
    });
  }

  if (lines.length === 0) throw conflict('NOTHING_TO_PAY', 'Ödenecek kalem kalmadı');

  const priced = lines.map((line) => ({
    ...line,
    amount: unitTotal(line.item.unitPrice, line.item.modifiers) * line.quantity,
  }));
  const amount = priced.reduce((sum, line) => sum + line.amount, 0);

  const payment = await prisma.$transaction(async (tx) => {
    for (const line of priced) {
      const result = await tx.orderItem.updateMany({
        where: {
          id: line.item.id,
          status: 'ACTIVE',
          quantity: line.item.quantity,
          paidQuantity: line.item.paidQuantity,
        },
        data: { paidQuantity: { increment: line.quantity } },
      });
      if (result.count !== 1) {
        throw conflict('ITEM_CHANGED', 'Adisyon başka bir cihazda değişti, ekranı yenileyip tekrar deneyin');
      }
    }

    const created = await tx.payment.create({
      data: {
        orderId,
        method: body.method,
        amount,
        receivedById: staff.id,
        items: {
          create: priced.map((line) => ({
            orderItemId: line.item.id,
            quantity: line.quantity,
            amount: line.amount,
          })),
        },
      },
    });

    await settleOrder(tx, orderId);
    return created;
  });

  const [dto, summaries] = await Promise.all([loadOrderDTO(prisma, orderId), getTableSummaries([order.tableId])]);
  emit.orderUpdated(dto);
  emit.tableUpdated(summaries);

  return {
    order: dto,
    payment: {
      id: payment.id,
      method: payment.method,
      amount: payment.amount,
      createdAt: payment.createdAt.toISOString(),
    },
  };
}
