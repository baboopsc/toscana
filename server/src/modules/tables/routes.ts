import { Router } from 'express';
import { requireRole } from '../../middleware/auth.js';
import { getAreas } from './service.js';

const router = Router();

router.get('/areas', requireRole('WAITER', 'CASHIER', 'ADMIN'), async (_req, res) => {
  res.json(await getAreas());
});

export default router;
