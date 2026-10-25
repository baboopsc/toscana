import { Router } from 'express';
import { z } from 'zod';
import { currentStaff, requireRole } from '../../middleware/auth.js';
import { parseId, validateBody } from '../../middleware/validate.js';
import { pay } from './service.js';

const paySchema = z.object({
  method: z.enum(['CASH', 'CARD']),
  items: z
    .array(
      z.object({
        orderItemId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .max(100)
    .optional(),
});

const router = Router();

router.post('/orders/:id/payments', requireRole('CASHIER', 'ADMIN'), validateBody(paySchema), async (req, res) => {
  const body = req.body as z.infer<typeof paySchema>;
  res.status(201).json(await pay(parseId(req.params.id, 'adisyon'), currentStaff(req), body));
});

export default router;
