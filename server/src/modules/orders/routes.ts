import { Router } from 'express';
import { z } from 'zod';
import { currentStaff, requireRole } from '../../middleware/auth.js';
import { parseId, validateBody } from '../../middleware/validate.js';
import { addItems, getTableOrder, moveOrder, voidItem } from './service.js';

const addItemsSchema = z.object({
  clientRequestId: z.string().min(8).max(64),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(99),
        modifierIds: z.array(z.number().int().positive()).max(10).default([]),
        note: z.string().trim().max(120).nullish(),
      }),
    )
    .min(1, 'En az bir ürün seçin')
    .max(60),
});

const voidSchema = z.object({
  quantity: z.number().int().min(1).max(99),
  reason: z.string().trim().min(3, 'İptal sebebi en az 3 karakter olmalı').max(120),
});

const moveSchema = z.object({
  targetTableId: z.number().int().positive(),
});

const router = Router();

router.get('/tables/:tableId/order', requireRole('WAITER', 'CASHIER', 'ADMIN'), async (req, res) => {
  res.json(await getTableOrder(parseId(req.params.tableId, 'masa')));
});

router.post(
  '/tables/:tableId/items',
  requireRole('WAITER', 'CASHIER', 'ADMIN'),
  validateBody(addItemsSchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof addItemsSchema>;
    const result = await addItems(parseId(req.params.tableId, 'masa'), currentStaff(req), body);
    res.status(result.duplicate ? 200 : 201).json({ order: result.order, ticketId: result.ticketId });
  },
);

router.post('/order-items/:id/void', requireRole('CASHIER', 'ADMIN'), validateBody(voidSchema), async (req, res) => {
  const body = req.body as z.infer<typeof voidSchema>;
  res.json(await voidItem(parseId(req.params.id, 'kalem'), currentStaff(req), body));
});

router.post('/orders/:id/move', requireRole('CASHIER', 'ADMIN'), validateBody(moveSchema), async (req, res) => {
  const body = req.body as z.infer<typeof moveSchema>;
  res.json(await moveOrder(parseId(req.params.id, 'adisyon'), body));
});

export default router;
