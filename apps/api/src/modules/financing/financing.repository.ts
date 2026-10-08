import { prisma } from '../../shared/prisma-client.ts';
import type { FinancingProduct } from '@prisma/client';

export const listProducts = () =>
  prisma.financingProduct.findMany({ orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] });

export const findProductById = (id: string) =>
  prisma.financingProduct.findUnique({ where: { id } });

export const findDefaultProduct = () =>
  prisma.financingProduct.findFirst({ where: { isDefault: true, active: true } });

export const createProduct = (
  data: Omit<FinancingProduct, 'id' | 'createdAt' | 'updatedAt'>,
) => prisma.financingProduct.create({ data });

export const updateProduct = (
  id: string,
  data: Partial<Omit<FinancingProduct, 'id' | 'createdAt' | 'updatedAt'>>,
) => prisma.financingProduct.update({ where: { id }, data });

export async function setDefaultProduct(id: string): Promise<void> {
  await prisma.$transaction([
    prisma.financingProduct.updateMany({ data: { isDefault: false } }),
    prisma.financingProduct.update({ where: { id }, data: { isDefault: true } }),
  ]);
}
