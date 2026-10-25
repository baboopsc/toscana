// İlk kurulum: server/.env dosyasını oluşturur.
// Hazır bir bağlantı adresi (Neon vb.) yapıştırılabilir ya da yerel PostgreSQL bilgileri sorulur.
// Rastgele bir oturum anahtarı üretir.

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(root, 'server', '.env');

if (existsSync(envPath)) {
  const current = readFileSync(envPath, 'utf8');
  if (current.includes('DATABASE_URL') && current.includes('JWT_SECRET')) {
    console.log('server/.env zaten var, aynen kullanılacak. Değiştirmek için dosyayı silip tekrar çalıştırın.');
    process.exit(0);
  }
}

// Satırları sırayla okuyan küçük yardımcı (hem klavyeden hem yönlendirilmiş girişten çalışır).
const rl = createInterface({ input: process.stdin, terminal: false });
const lines = rl[Symbol.asyncIterator]();
async function ask(question) {
  process.stdout.write(question);
  const { value, done } = await lines.next();
  return done ? '' : String(value).trim();
}

/** Neon'un eklediği channel_binding parametresini çıkarır; sslmode yoksa ekler. */
function cleanUrl(raw) {
  const url = new URL(raw.replace(/^['"]|['"]$/g, ''));
  url.searchParams.delete('channel_binding');
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (!isLocal && !url.searchParams.has('sslmode')) url.searchParams.set('sslmode', 'require');
  return url.toString();
}

console.log('\nToscana kurulumu: veritabanı bağlantısı\n');
console.log('Neon gibi hazır bir veritabanı kullanıyorsanız bağlantı adresini yapıştırın');
console.log('(postgresql://... ile başlar). Yerel PostgreSQL için boş bırakıp Enter\'a basın.\n');

const pasted = await ask('Bağlantı adresi: ');

let databaseUrl;
if (/^postgres(ql)?:\/\//i.test(pasted)) {
  try {
    databaseUrl = cleanUrl(pasted);
  } catch {
    rl.close();
    console.error('Adres okunamadı. Neon panelindeki "Connection string" değerini olduğu gibi kopyalayın.');
    process.exit(1);
  }
} else {
  if (pasted) console.log('Adres postgresql:// ile başlamıyor, yerel PostgreSQL bilgileri sorulacak.\n');
  console.log('Boş bırakırsanız köşeli parantez içindeki değer kullanılır.\n');
  const user = (await ask('PostgreSQL kullanıcı adı [postgres]: ')) || 'postgres';
  const password = await ask('PostgreSQL şifresi (kurulumda belirlediğiniz): ');
  const host = (await ask('Sunucu [127.0.0.1]: ')) || '127.0.0.1';
  const port = (await ask('Port [5432]: ')) || '5432';
  const database = (await ask('Veritabanı adı [toscana]: ')) || 'toscana';

  if (!password) {
    rl.close();
    console.error('\nŞifre boş olamaz. PostgreSQL kurulumunda belirlediğiniz şifreyi yazın.');
    process.exit(1);
  }
  if (!/^[A-Za-z0-9_]+$/.test(database)) {
    rl.close();
    console.error('Veritabanı adı yalnızca harf, rakam ve alt çizgi içermeli.');
    process.exit(1);
  }
  databaseUrl = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}
rl.close();

const secret = randomBytes(48).toString('hex');
const content = `# npm run setup tarafından oluşturuldu
DATABASE_URL="${databaseUrl}"
JWT_SECRET="${secret}"
PORT=3000
HOST=0.0.0.0
`;

writeFileSync(envPath, content, 'utf8');
console.log('\nserver/.env oluşturuldu.\n');
