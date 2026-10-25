import type { CategoryDTO } from '@toscana/shared';
import { prisma } from '../../db.js';
import { notFound } from '../../lib/httpError.js';
import { emit } from '../../socket.js';

export async function getMenu(): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: {
      products: {
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: { modifiers: { include: { modifier: true } } },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    isNew: category.isNew,
    products: category.products.map((product) => ({
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description,
      price: product.price,
      vatRate: product.vatRate,
      isNew: product.isNew,
      isAvailable: product.isAvailable,
      modifiers: product.modifiers
        .map((link) => link.modifier)
        .filter((modifier) => modifier.isActive)
        .sort((a, b) => a.id - b.id)
        .map((modifier) => ({ id: modifier.id, name: modifier.name, price: modifier.price })),
    })),
  }));
}

export async function setAvailability(productId: number, isAvailable: boolean) {
  const existing = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!existing) throw notFound('PRODUCT_NOT_FOUND', 'Ürün bulunamadı');

  await prisma.product.update({ where: { id: productId }, data: { isAvailable } });
  const payload = { productId, isAvailable };
  emit.menuUpdated(payload);
  return payload;
}
