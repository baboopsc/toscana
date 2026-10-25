import { Router } from 'express';
import type { AddressesDTO } from '@toscana/shared';
import { config } from '../../config.js';
import { lanAddresses } from '../../lib/network.js';
import { requireRole } from '../../middleware/auth.js';

const router = Router();

// Kasa ekranındaki "Telefon bağla" QR kodu için adresler.
// İnternette yayındaysa (Render) önce genel adres, yoksa yerel ağ adresleri.
router.get('/system/addresses', requireRole('CASHIER', 'ADMIN'), async (_req, res) => {
  if (config.publicUrl) {
    const body: AddressesDTO = { port: config.port, urls: [config.publicUrl] };
    res.json(body);
    return;
  }
  const addresses = await lanAddresses();
  const body: AddressesDTO = {
    port: config.port,
    urls: addresses.map((address) => `http://${address}:${config.port}`),
  };
  res.json(body);
});

export default router;
