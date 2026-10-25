import { Router } from 'express';
import { requireRole } from '../../middleware/auth.js';
import { parseId } from '../../middleware/validate.js';
import { completeTicket, listOpenTickets } from './service.js';

const router = Router();

router.get('/kitchen/tickets', requireRole('KITCHEN', 'ADMIN'), async (_req, res) => {
  res.json(await listOpenTickets());
});

router.post('/kitchen/tickets/:id/complete', requireRole('KITCHEN', 'ADMIN'), async (req, res) => {
  res.json(await completeTicket(parseId(req.params.id, 'mutfak kartı')));
});

export default router;
