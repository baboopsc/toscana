import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { HealthDTO } from '@toscana/shared';
import { requireAuth } from './middleware/auth.js';
import { apiNotFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/routes.js';
import kitchenRoutes from './modules/kitchen/routes.js';
import menuRoutes from './modules/menu/routes.js';
import orderRoutes from './modules/orders/routes.js';
import paymentRoutes from './modules/payments/routes.js';
import reportRoutes from './modules/reports/routes.js';
import systemRoutes from './modules/system/routes.js';
import tableRoutes from './modules/tables/routes.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(currentDir, '../../client/dist');

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '200kb' }));

  app.get('/api/health', (_req, res) => {
    const body: HealthDTO = { ok: true, serverTime: Date.now() };
    res.set('Cache-Control', 'no-store').json(body);
  });

  app.use('/api/auth', authRoutes);

  // Buradan sonraki tüm /api adresleri giriş ister.
  app.use('/api', requireAuth);
  app.use('/api', menuRoutes);
  app.use('/api', tableRoutes);
  app.use('/api', orderRoutes);
  app.use('/api', paymentRoutes);
  app.use('/api', kitchenRoutes);
  app.use('/api', reportRoutes);
  app.use('/api', systemRoutes);
  app.use('/api', apiNotFound);

  if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist, { index: false, maxAge: '7d' }));
    // React Router adresleri (/garson, /kasa/masa/3 …) için index.html döner.
    app.use((req, res, next) => {
      if (req.method !== 'GET' || path.extname(req.path)) {
        next();
        return;
      }
      res.set('Cache-Control', 'no-store');
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res
        .type('text/plain; charset=utf-8')
        .send(
          'Arayüz henüz derlenmemiş. Geliştirme sırasında http://localhost:5173 adresini kullanın ' +
            'ya da kök klasörde "npm run build" çalıştırın.',
        );
    });
  }

  app.use(errorHandler);
  return app;
}
