import {
  computeTotals,
  lineTotal,
  type OrderDTO,
  type OrderItemStatus,
  type OrderStatus,
} from '@toscana/shared';
import type { Db } from '../../db.js';

export const orderInclude = {
  table: { select: { name: true } },
  openedBy: { select: { name: true } },
  items: {
    orderBy: { id: 'asc' as const },
    include: { modifiers: { orderBy: { id: 'asc' as const } } },
  },
};

interface OrderWithRelations {
  id: number;
  tableId: number;
  status: OrderStatus;
  openedAt: Date;
  table: { name: string };
  openedBy: { name: string };
  items: {
    id: number;
    ticketId: number;
    productId: number;
    productName: string;
    unitPrice: number;
    vatRate: number;
    quantity: number;
    paidQuantity: number;
    note: string | null;
    status: OrderItemStatus;
    voidReason: string | null;
    modifiers: { name: string; price: number }[];
  }[];
}

export function toOrderDTO(order: OrderWithRelations): OrderDTO {
  return {
    id: order.id,
    tableId: order.tableId,
    tableName: order.table.name,
    status: order.status,
    openedAt: order.openedAt.toISOString(),
    openedBy: order.openedBy.name,
    items: order.items.map((item) => ({
      id: item.id,
      ticketId: item.ticketId,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
      quantity: item.quantity,
      paidQuantity: item.paidQuantity,
      modifiers: item.modifiers.map((modifier) => ({ name: modifier.name, price: modifier.price })),
      note: item.note,
      status: item.status,
      voidReason: item.voidReason,
      lineTotal: lineTotal(item),
    })),
    totals: computeTotals(order.items),
  };
}

export async function loadOrderDTO(db: Db, orderId: number): Promise<OrderDTO> {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: orderInclude });
  return toOrderDTO(order);
}

/**
 * Adisyonun durumunu kalemlere göre günceller:
 * hiç aktif kalem yoksa CANCELLED, aktif kalemlerin tamamı ödendiyse CLOSED.
 */
export async function settleOrder(db: Db, orderId: number): Promise<OrderStatus> {
  const items = await db.orderItem.findMany({
    where: { orderId, status: 'ACTIVE' },
    select: { quantity: true, paidQuantity: true },
  });

  let status: OrderStatus = 'OPEN';
  if (items.length === 0) status = 'CANCELLED';
  else if (items.every((item) => item.paidQuantity >= item.quantity)) status = 'CLOSED';

  if (status !== 'OPEN') {
    await db.order.update({ where: { id: orderId }, data: { status, closedAt: new Date() } });
  }
  return status;
}
