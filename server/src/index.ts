import http from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';
import { prisma } from './db.js';
import { lanAddresses } from './lib/network.js';
import { closeSocket, initSocket } from './socket.js';

try {
  await prisma.$queryRaw`SELECT 1`;
} catch (error) {
  console.error('\nVeritabanına bağlanılamadı.');
  console.error('- PostgreSQL servisi çalışıyor mu?');
  console.error('- server/.env içindeki DATABASE_URL doğru mu?');
  console.error('- Kurulum yapıldı mı? Kök klasörde: npm run setup\n');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const app = createApp();
const server = http.createServer(app);
initSocket(server);

server.listen(config.port, config.host, () => {
  if (config.publicUrl) {
    console.log(`\nToscana Ristorante sunucusu çalışıyor: ${config.publicUrl}/giris\n`);
    return;
  }
  void lanAddresses().then((addresses) => {
    console.log('\nToscana Ristorante sunucusu çalışıyor');
    console.log(`  Bu bilgisayar : http://localhost:${config.port}`);
    const [primary, ...others] = addresses;
    if (primary) console.log(`  Telefonlar    : http://${primary}:${config.port}/giris`);
    for (const address of others) console.log(`  Diğer adres   : http://${address}:${config.port}`);
    console.log('');
  });
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${config.port} kullanımda. Sunucu zaten açık olabilir ya da .env içinde PORT değiştirin.`);
    process.exit(1);
  }
  throw error;
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} alındı, sunucu kapatılıyor…`);
  await closeSocket();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
