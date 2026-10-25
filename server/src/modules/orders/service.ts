import type {
  AddItemsRequest,
  AddItemsResponse,
  MoveOrderRequest,
  OrderDTO,
  VoidItemRequest,
} from '@toscana/shared';
import { isUniqueViolation, prisma } from '../../db.js';
import { badRequest, conflict, notFound } from '../../lib/httpError.js';
import type { AuthStaff } from '../../middleware/auth.js';
import { emit } from '../../socket.js';
import { loadTicketDTOs } from '../kitchen/dto.js';
import { getTableSummaries } from '../tables/service.js';
import { loadOrderDTO, orderInclude, settleOrder, toOrderDTO } from './dto.js';

const MAX_TX_ATTEMPTS = 3;

export async function getTableOrder(tableId: number): Promise<OrderDTO | null> {
  const order = await prisma.order.findFirst({
    where: { tableId, status: 'OPEN' },
    include: orderInclude,
  });
  return order ? toOrderDTO(order) : null;
}

async function duplicateResult(clientRequestId: string): Promise<(AddItemsResponse & { duplicate: true }) | null> {
  const ticket = await prisma.kitchenTicket.findUnique({ where: { clientRequestId } });
  if (!ticket) return null;
  return { order: await loadOrderDTO(prisma, ticket.orderId), ticketId: ticket.id, duplicate: true };
}

/**
 * Masaya ürün ekler ve tek bir mutfak kartı açar.
 * Aynı clientRequestId ikinci kez gelirse yeni kart açmaz, ilk sonucu döner.
 */
export async function addItems(
  tableId: number,
  staff: AuthStaff,
  body: AddItemsRequest,
): Promise<AddItemsResponse & { duplicate: boolean }> {
  const earlier = await duplicateResult(body.clientRequestId);
  if (earlier) return earlier;

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table || !table.isActive) throw notFound('TABLE_NOT_FOUND', 'Masa bulunamadı');

  const productIds = [...new Set(body.items.map((line) => line.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { modifiers: { include: { modifier: true } } },
  });
  const productsById = new Map(products.map((product) => [product.id, product]));

  const prepared = body.items.map((line) => {
    const product = productsById.get(line.productId);
    if (!product) throw badRequest('PRODUCT_NOT_FOUND', `Ürün bulunamadı (#${line.productId})`);
    if (!product.isAvailable) throw conflict('PRODUCT_UNAVAILABLE', `${product.name} tükendi`);

    const allowed = new Map(product.modifiers.map((link) => [link.modifierId, link.modifier]));
    const modifiers = [...new Set(line.modifierIds)].map((modifierId) => {
      const modifier = allowed.get(modifierId);
      if (!modifier || !modifier.isActive) {
        throw badRequest('MODIFIER_NOT_ALLOWED', `${product.name} için bu ekstra seçilemez`);
      }
      return modifier;
    });

    const note = line.note?.trim() ? line.note.trim() : null;
    return { product, quantity: line.quantity, modifiers, note };
  });

  let created: { orderId: number; ticketId: number } | null = null;

  for (let attempt = 1; attempt <= MAX_TX_ATTEMPTS && !created; attempt++) {
    try {
      created = await prisma.$transaction(async (tx) => {
        const order =
          (await tx.order.findFirst({ where: { tableId, status: 'OPEN' } })) ??
          (await tx.order.create({ data: { tableId, openedById: staff.id } }));

        const ticket = await tx.kitchenTicket.create({
          data: { clientRequestId: body.clientRequestId, orderId: order.id, createdById: staff.id },
        });

        for (const line of prepared) {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              ticketId: ticket.id,
              productId: line.product.id,
              productName: line.product.name,
              unitPrice: line.product.price,
              vatRate: line.product.vatRate,
              quantity: line.quantity,
              note: line.note,
              modifiers: {
                create: line.modifiers.map((modifier) => ({
                  modifierId: modifier.id,
                  name: modifier.name,
                  price: modifier.price,
                })),
              },
            },
          });
        }

        return { orderId: order.id, ticketId: ticket.id };
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // Ya aynı istek ikinci kez geldi ya da başka bir cihaz aynı anda bu masaya hesap açtı.
      const duplicate = await duplicateResult(body.clientRequestId);
      if (duplicate) return duplicate;
      if (attempt === MAX_TX_ATTEMPTS) {
        throw conflict('TABLE_BUSY', 'Masa şu an başka bir cihazda güncelleniyor, tekrar deneyin');
      }
    }
  }

  if (!created) throw conflict('TABLE_BUSY', 'Sipariş kaydedilemedi, tekrar deneyin');

  const [order, tickets, summaries] = await Promise.all([
    loadOrderDTO(prisma, created.orderId),
    loadTicketDTOs(prisma, { id: created.ticketId }),
    getTableSummaries([tableId]),
  ]);

  const ticket = tickets[0];
  if (ticket) emit.ticketCreated(ticket);
  emit.orderUpdated(order);
  emit.tableUpdated(summaries);

  return { order, ticketId: created.ticketId, duplicate: false };
}

/**
 * Kalem iptali. Adetin tamamı iptal edilirse kalem VOID olur; bir kısmı iptal edilirse
 * kalemin adedi düşer ve aynı mutfak kartına o adette VOID bir satır eklenir.
 * Ödenmiş adetler iptal edilemez.
 */
export async function voidItem(itemId: number, staff: AuthStaff, body: VoidItemRequest): Promise<OrderDTO> {
  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: true, ticket: true, modifiers: true },
  });
  if (!item) throw notFound('ITEM_NOT_FOUND', 'Kalem bulunamadı');
  if (item.order.status !== 'OPEN') throw conflict('ORDER_CLOSED', 'Bu adisyon kapanmış');
  if (item.status !== 'ACTIVE') throw conflict('ALREADY_VOID', 'Bu kalem zaten iptal edilmiş');

  const unpaid = item.quantity - item.paidQuantity;
  if (body.quantity > unpaid) {
    throw conflict(
      'VOID_EXCEEDS_UNPAID',
      unpaid === 0
        ? 'Bu kalemin tamamı ödenmiş, iptal edilemez'
        : `En fazla ${unpaid} adet iptal edilebilir (ödenmiş adetler iptal edilemez)`,
    );
  }

  const now = new Date();
  const voidedRowId = await prisma.$transaction(async (tx) => {
    if (body.quantity === item.quantity) {
      const result = await tx.orderItem.updateMany({
        where: { id: item.id, status: 'ACTIVE', quantity: item.quantity, paidQuantity: 0 },
        data: { status: 'VOID', voidReason: body.reason, voidedAt: now, voidedById: staff.id },
      });
      if (result.count !== 1) throw conflict('ITEM_CHANGED', 'Kalem başka bir cihazda değişti, ekranı yenileyin');
      await settleOrder(tx, item.orderId);
      return item.id;
    }

    const result = await tx.orderItem.updateMany({
      where: { id: item.id, status: 'ACTIVE', quantity: item.quantity, paidQuantity: item.paidQuantity },
      data: { quantity: { decrement: body.quantity } },
    });
    if (result.count !== 1) throw conflict('ITEM_CHANGED', 'Kalem başka bir cihazda değişti, ekranı yenileyin');

    const voidRow = await tx.orderItem.create({
      data: {
        orderId: item.orderId,
        ticketId: item.ticketId,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        quantity: body.quantity,
        note: item.note,
        status: 'VOID',
        voidReason: body.reason,
        voidedAt: now,
        voidedById: staff.id,
        modifiers: {
          create: item.modifiers.map((modifier) => ({
            modifierId: modifier.modifierId,
            name: modifier.name,
            price: modifier.price,
          })),
        },
      },
    });
    await settleOrder(tx, item.orderId);
    return voidRow.id;
  });

  const [order, summaries] = await Promise.all([
    loadOrderDTO(prisma, item.orderId),
    getTableSummaries([item.order.tableId]),
  ]);

  if (!item.ticket.completedAt) {
    emit.ticketItemVoided({ ticketId: item.ticketId, orderItemId: voidedRowId, quantity: body.quantity });
  }
  emit.orderUpdated(order);
  emit.tableUpdated(summaries);
  return order;
}

/** Açık adisyonu boş bir masaya taşır. */
export async function moveOrder(orderId: number, body: MoveOrderRequest): Promise<OrderDTO> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw notFound('ORDER_NOT_FOUND', 'Adisyon bulunamadı');
  if (order.status !== 'OPEN') throw conflict('ORDER_CLOSED', 'Bu adisyon kapanmış');
  if (order.tableId === body.targetTableId) throw badRequest('SAME_TABLE', 'Adisyon zaten bu masada');

  const target = await prisma.table.findUnique({ where: { id: body.targetTableId } });
  if (!target || !target.isActive) throw notFound('TABLE_NOT_FOUND', 'Hedef masa bulunamadı');

  const occupied = await prisma.order.findFirst({ where: { tableId: target.id, status: 'OPEN' } });
  if (occupied) throw conflict('TARGET_OCCUPIED', `${target.name} masasında açık hesap var`);

  try {
    await prisma.order.update({ where: { id: orderId }, data: { tableId: target.id } });
  } catch (error) {
    if (isUniqueViolation(error)) throw conflict('TARGET_OCCUPIED', `${target.name} masasında açık hesap var`);
    throw error;
  }

  const [dto, summaries] = await Promise.all([
    loadOrderDTO(prisma, orderId),
    getTableSummaries([order.tableId, target.id]),
  ]);
  emit.orderUpdated(dto);
  emit.tableUpdated(summaries);
  return dto;
}
