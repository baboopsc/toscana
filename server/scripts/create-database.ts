import 'dotenv/config';
import pg from 'pg';

// DATABASE_URL'deki veritabanına bağlanmayı dener; yoksa (yerel PostgreSQL'de) oluşturur.
// Neon gibi hazır veritabanlarında veritabanı zaten vardır, hiçbir şey yapmaz.

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error('DATABASE_URL tanımlı değil. Önce kök klasörde "npm run setup" çalıştırın.');
  process.exit(1);
}

function explain(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Veritabanına bağlanılamadı:', message);
  if (message.includes('ECONNREFUSED')) {
    console.error('- Bu adreste çalışan bir PostgreSQL yok. Yerel PostgreSQL servisi açık mı?');
  } else if (message.includes('password') || message.includes('authentication')) {
    console.error('- Kullanıcı adı veya şifre hatalı. server/.env dosyasını silip "npm run setup" ile tekrar girin.');
  } else if (message.includes('ENOTFOUND') || message.includes('ETIMEDOUT')) {
    console.error('- Sunucu adresine ulaşılamıyor. İnternet bağlantısını ve adresi kontrol edin.');
  }
}

const target = new URL(raw);
const databaseName = decodeURIComponent(target.pathname.replace(/^\//, ''));

const direct = new pg.Client({ connectionString: raw });
try {
  await direct.connect();
  await direct.query('SELECT 1');
  console.log(`Veritabanı hazır: ${databaseName}`);
  await direct.end();
  process.exit(0);
} catch (error) {
  await direct.end().catch(() => undefined);
  const code = (error as { code?: string }).code;
  if (code !== '3D000') {
    // 3D000 = veritabanı yok; diğer hatalarda oluşturmayı denemenin anlamı yok.
    explain(error);
    process.exit(1);
  }
}

if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
  console.error(`Veritabanı adı yalnızca harf, rakam ve alt çizgi içermeli: "${databaseName}"`);
  process.exit(1);
}

const admin = new URL(raw);
admin.pathname = '/postgres';
const client = new pg.Client({ connectionString: admin.toString() });

try {
  await client.connect();
  await client.query(`CREATE DATABASE "${databaseName}"`);
  console.log(`Veritabanı oluşturuldu: ${databaseName}`);
} catch (error) {
  explain(error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
