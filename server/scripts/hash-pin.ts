import bcrypt from 'bcryptjs';

// Kullanım: npm run pin -w server -- 4821
// Çıktıyı Prisma Studio'da ilgili personelin pinHash alanına yapıştırın.

const pin = process.argv[2];
if (!pin || !/^\d{4}$/.test(pin)) {
  console.error('4 haneli bir PIN verin. Örnek: npm run pin -w server -- 4821');
  process.exit(1);
}

console.log(await bcrypt.hash(pin, 10));
