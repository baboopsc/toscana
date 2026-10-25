import { Router } from 'express';
import { z } from 'zod';
import { currentStaff, requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { listActiveStaff, login, me } from './service.js';

const loginSchema = z.object({
  staffId: z.number().int().positive(),
  pin: z.string().regex(/^\d{4}$/, 'PIN 4 haneli olmalı'),
});

const router = Router();

router.get('/staff', async (_req, res) => {
  res.json(await listActiveStaff());
});

router.post('/login', validateBody(loginSchema), async (req, res) => {
  res.json(await login(req.body as z.infer<typeof loginSchema>));
});

router.get('/me', requireAuth, async (req, res) => {
  res.json(await me(currentStaff(req)));
});

export default router;
