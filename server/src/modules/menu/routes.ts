import { Router } from 'express';
import { z } from 'zod';
import { requireRole } from '../../middleware/auth.js';
import { parseId, validateBody } from '../../middleware/validate.js';
import { getMenu, setAvailability } from './service.js';

const availabilitySchema = z.object({ isAvailable: z.boolean() });

const router = Router();

router.get('/menu', async (_req, res) => {
  res.json(await getMenu());
});

router.patch(
  '/products/:id/availability',
  requireRole('CASHIER', 'ADMIN'),
  validateBody(availabilitySchema),
  async (req, res) => {
    const { isAvailable } = req.body as z.infer<typeof availabilitySchema>;
    res.json(await setAvailability(parseId(req.params.id, 'ürün'), isAvailable));
  },
);

export default router;
