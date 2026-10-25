import { computeTotals, lineTotal, type DailyReportDTO } from '@toscana/shared';
import { prisma } from '../../db.js';
import { dayRange } from '../../lib/dates.js';

export async function getDailyReport(date: string): Promise<DailyReportDTO> {
  const { start, end } = dayRange(date);

  const [payments, closedOrderCount, openOrders, voids] = await Promise.all([
    prisma.payment.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { items: { include: { orderItem: { select: { productName: true } } } } },
    }),
    prisma.order.count({ where: { status: 'CLOSED', closedAt: { gte: start, lt: end } } }),
    prisma.order.findMany({
      where: { status: 'OPEN' },
      include: { items: { include: { modifiers: true } } },
    }),
    prisma.orderItem.findMany({
      where: { status: 'VOID', voidedAt: { gte: start, lt: end } },
      include: { voidedBy: { select: { name: true } }, modifiers: true },
      orderBy: { voidedAt: 'asc' },
    }),
  ]);

  let cash = 0;
  let card = 0;
  const products = new Map<string, { name: string; quantity: number; amount: number }>();

  for (const payment of payments) {
    if (payment.method === 'CASH') cash += payment.amount;
    else card += payment.amount;

    for (const item of payment.items) {
      const name = item.orderItem.productName;
      const entry = products.get(name) ?? { name, quantity: 0, amount: 0 };
      entry.quantity += item.quantity;
      entry.amount += item.amount;
      products.set(name, entry);
    }
  }

  const openRemaining = openOrders.reduce((sum, order) => sum + computeTotals(order.items).remaining, 0);

  return {
    date,
    cash,
    card,
    total: cash + card,
    paymentCount: payments.length,
    closedOrderCount,
    openOrderCount: openOrders.length,
    openRemaining,
    products: [...products.values()].sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, 'tr')),
    voids: voids.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      amount: lineTotal(item),
      reason: item.voidReason ?? '',
      staffName: item.voidedBy?.name ?? '',
      at: (item.voidedAt ?? item.createdAt).toISOString(),
    })),
  };
}
