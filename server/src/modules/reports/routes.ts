import { Router } from 'express';
import { todayLocal } from '../../lib/dates.js';
import { requireRole } from '../../middleware/auth.js';
import { getDailyReport } from './service.js';

const router = Router();

router.get('/reports/daily', requireRole('CASHIER', 'ADMIN'), async (req, res) => {
  const date = typeof req.query.date === 'string' && req.query.date ? req.query.date : todayLocal();
  res.json(await getDailyReport(date));
});

export default router;
