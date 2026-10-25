import dgram from 'node:dgram';
import os from 'node:os';

// Sanal ağ kartları (Hyper-V, WSL, VirtualBox, VMware, VPN…) telefonlardan erişilemez; listede sona atılır.
const VIRTUAL = /(vethernet|virtualbox|vmware|hyper-v|wsl|docker|loopback|tailscale|zerotier|hamachi|vpn|bluetooth|npcap)/i;

/** İşletim sisteminin dışarı çıkarken kullandığı yerel IP (paket gönderilmez, sadece rota sorulur). */
function routedAddress(): Promise<string | null> {
  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4');
    const done = (value: string | null) => {
      try {
        socket.close();
      } catch {
        // zaten kapalı
      }
      resolve(value);
    };
    socket.on('error', () => done(null));
    try {
      socket.connect(53, '192.0.2.1', () => {
        try {
          done(socket.address().address);
        } catch {
          done(null);
        }
      });
    } catch {
      done(null);
    }
    setTimeout(() => done(null), 500);
  });
}

/** Kasa bilgisayarının yerel ağ IPv4 adresleri; telefonların erişebileceği adres en başta. */
export async function lanAddresses(): Promise<string[]> {
  const candidates: { address: string; name: string }[] = [];
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal && !entry.address.startsWith('169.254.')) {
        candidates.push({ address: entry.address, name });
      }
    }
  }

  const routed = await routedAddress();
  const score = (c: { address: string; name: string }) =>
    (c.address === routed ? 0 : 10) + (VIRTUAL.test(c.name) ? 5 : 0) + (c.address.startsWith('192.168.') ? 0 : 1);

  return candidates.sort((a, b) => score(a) - score(b)).map((c) => c.address);
}
