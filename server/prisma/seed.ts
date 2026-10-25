import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

// Menü, masalar ve test personeli. Tekrar çalıştırılırsa var olan kayıtlara
// dokunmaz, sadece eksikleri ekler (Prisma Studio'da yapılan fiyat değişiklikleri korunur).

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL tanımlı değil. server/.env dosyasını kontrol edin.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const TL = (lira: number) => lira * 100;
const PARMESAN = 'Parmesan Peyniri (Ekstra)';

interface SeedProduct {
  name: string;
  price: number;
  description?: string;
  isNew?: boolean;
  modifiers?: string[];
}

interface SeedCategory {
  name: string;
  isNew?: boolean;
  products: SeedProduct[];
}

const areas = [
  { name: 'Salon', prefix: 'S', count: 12 },
  { name: 'Bahçe', prefix: 'B', count: 8 },
];

const categories: SeedCategory[] = [
  {
    name: 'Makarnalar',
    products: [
      {
        name: 'Fettuccine Alfredo',
        price: TL(250),
        description: 'Taze fettuccini makarna, tavuk, mantar, krema, tereyağı ve baharatlar.',
        modifiers: [PARMESAN],
      },
      {
        name: 'Fettuccini Pesto',
        price: TL(240),
        description: 'Taze fettuccini makarna, pesto sos (çam fıstığı, fesleğen, zeytinyağı) ve krema.',
        modifiers: [PARMESAN],
      },
      {
        name: 'Fettuccini Tartufo',
        price: TL(240),
        description: 'Taze fettuccini makarna, kültür mantarı ve siyah trüf yağı.',
        modifiers: [PARMESAN],
      },
      {
        name: 'Fettuccini Melanzana',
        price: TL(260),
        description: 'Taze fettuccini makarna, ballı hardal soslu tavuk, köz patlıcan, karamelize soğan ve krema.',
        modifiers: [PARMESAN],
      },
      {
        name: 'Fettuccini Verdura',
        price: TL(260),
        description: 'Taze fettuccini makarna, sebzeli tavuk sote, soya sosu ve krema.',
        modifiers: [PARMESAN],
      },
      {
        name: 'Fettuccini Pomodori',
        price: TL(240),
        description: 'Taze fettuccini makarna, taze domates sosu, konfit domates, fesleğen ve zeytinyağı.',
        modifiers: [PARMESAN],
      },
      {
        name: 'Fettuccini Arrabbiata',
        price: TL(240),
        description: 'Taze fettuccini makarna, acılı domates sosu, sarımsak ve fesleğen.',
        modifiers: [PARMESAN],
      },
      {
        name: 'Fettuccini Curry',
        price: TL(250),
        description: 'Taze fettuccini makarna, tavuk, köri sosu ve krema.',
        modifiers: [PARMESAN],
      },
      {
        name: 'Fettuccini Bolognase',
        price: TL(350),
        description: 'Taze fettuccini makarna, dana kaburgadan bolonez sos ve domates sosu.',
        modifiers: [PARMESAN],
      },
    ],
  },
  {
    name: 'Salatalar',
    products: [
      {
        name: 'Sezar',
        price: TL(270),
        description: 'Iceberg, marul, baharatlı tavuk, kruton, Sezar sos ve parmesan.',
      },
      {
        name: 'Mozarella',
        price: TL(290),
        description: 'Iceberg, marul, suda mozarella, çeri domates, vinegret ve pesto sos.',
      },
    ],
  },
  {
    name: 'Toscana Lezzetleri',
    isNew: true,
    products: [
      {
        name: 'Cotoletta',
        price: TL(390),
        isNew: true,
        description: 'Çıtır tavuk, pomodoro sos ve eritilmiş mozarella; Alfredo makarna ile servis edilir.',
      },
      {
        name: 'Polpette',
        price: TL(450),
        isNew: true,
        description: 'Köfte topları ve yoğun pomodoro sos; rustik ekmek ile servis edilir.',
      },
    ],
  },
  {
    name: 'İçecekler',
    products: [
      { name: 'Coca Cola', price: TL(100) },
      { name: 'Coca Cola Zero', price: TL(100) },
      { name: 'Fusetea', price: TL(100) },
      { name: 'Sprite', price: TL(100) },
      { name: 'Fanta', price: TL(100) },
      { name: 'Su', price: TL(40) },
    ],
  },
];

// Test PIN'leri. Canlıya geçmeden Prisma Studio'dan değiştirin
// (yeni PIN için: npm run pin -w server -- 1234 komutunun çıktısını pinHash alanına yapıştırın).
const staff = [
  { name: 'Yönetici', role: 'ADMIN' as const, pin: '9999' },
  { name: 'Kasa', role: 'CASHIER' as const, pin: '2222' },
  { name: 'Garson 1', role: 'WAITER' as const, pin: '1111' },
  { name: 'Garson 2', role: 'WAITER' as const, pin: '1112' },
  { name: 'Mutfak', role: 'KITCHEN' as const, pin: '3333' },
];

async function main() {
  const modifier = await prisma.modifier.upsert({
    where: { name: PARMESAN },
    update: {},
    create: { name: PARMESAN, price: TL(40) },
  });
  const modifiersByName = new Map([[modifier.name, modifier.id]]);

  for (const [areaIndex, areaSeed] of areas.entries()) {
    const area = await prisma.area.upsert({
      where: { name: areaSeed.name },
      update: {},
      create: { name: areaSeed.name, sortOrder: areaIndex },
    });
    for (let number = 1; number <= areaSeed.count; number++) {
      const name = `${areaSeed.prefix}${number}`;
      await prisma.table.upsert({
        where: { name },
        update: {},
        create: { name, areaId: area.id, sortOrder: number, seats: 4 },
      });
    }
  }

  for (const [categoryIndex, categorySeed] of categories.entries()) {
    const category = await prisma.category.upsert({
      where: { name: categorySeed.name },
      update: {},
      create: { name: categorySeed.name, sortOrder: categoryIndex, isNew: categorySeed.isNew ?? false },
    });

    for (const [productIndex, productSeed] of categorySeed.products.entries()) {
      const product = await prisma.product.upsert({
        where: { name: productSeed.name },
        update: {},
        create: {
          name: productSeed.name,
          price: productSeed.price,
          description: productSeed.description ?? null,
          isNew: productSeed.isNew ?? false,
          vatRate: 10,
          sortOrder: productIndex,
          categoryId: category.id,
        },
      });

      for (const modifierName of productSeed.modifiers ?? []) {
        const modifierId = modifiersByName.get(modifierName);
        if (!modifierId) throw new Error(`Seed hatası: ${modifierName} bulunamadı`);
        await prisma.productModifier.upsert({
          where: { productId_modifierId: { productId: product.id, modifierId } },
          update: {},
          create: { productId: product.id, modifierId },
        });
      }
    }
  }

  for (const person of staff) {
    const existing = await prisma.staff.findFirst({ where: { name: person.name } });
    if (existing) continue;
    await prisma.staff.create({
      data: { name: person.name, role: person.role, pinHash: await bcrypt.hash(person.pin, 10) },
    });
  }

  const [categoryCount, productCount, linkCount, areaCount, tableCount, staffCount] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.productModifier.count(),
    prisma.area.count(),
    prisma.table.count(),
    prisma.staff.count(),
  ]);

  console.log('Seed tamamlandı:');
  console.log(`  ${categoryCount} kategori, ${productCount} ürün, ${linkCount} ürün-ekstra bağlantısı`);
  console.log(`  ${areaCount} alan, ${tableCount} masa, ${staffCount} personel`);
  console.log('  Test PIN\'leri: Garson 1 = 1111, Garson 2 = 1112, Kasa = 2222, Mutfak = 3333, Yönetici = 9999');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
