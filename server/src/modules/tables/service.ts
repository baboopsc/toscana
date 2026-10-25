import { computeTotals, type AreaDTO, type PricedLine, type TableSummaryDTO } from '@toscana/shared';
import { prisma, type Db } from '../../db.js';

interface TableWithOpenOrder {
  id: number;
  name: string;
  areaId: number;
  orders: { id: number; openedAt: Date; items: PricedLine[] }[];
}

const openOrderInclude = {
  orders: {
    where: { status: 'OPEN' as const },
    include: { items: { include: { modifiers: true } } },
  },
};

export function toTableSummary(table: TableWithOpenOrder): TableSummaryDTO {
  const order = table.orders[0];
  return {
    id: table.id,
    name: table.name,
    areaId: table.areaId,
    orderId: order ? order.id : null,
    total: order ? computeTotals(order.items).gross : 0,
    openedAt: order ? order.openedAt.toISOString() : null,
  };
}

export async function getAreas(): Promise<AreaDTO[]> {
  const areas = await prisma.area.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: {
      tables: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: openOrderInclude,
      },
    },
  });

  return areas.map((area) => ({
    id: area.id,
    name: area.name,
    tables: area.tables.map(toTableSummary),
  }));
}

export async function getTableSummaries(tableIds: number[], db: Db = prisma): Promise<TableSummaryDTO[]> {
  const tables = await db.table.findMany({
    where: { id: { in: tableIds } },
    include: openOrderInclude,
  });
  return tables.map(toTableSummary);
}
