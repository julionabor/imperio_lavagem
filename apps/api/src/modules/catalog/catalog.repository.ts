import { prisma } from '../../shared/prisma-client.ts';
import type { Brand, Model, EquipmentItem, Badge, SearchSynonym } from '@prisma/client';

// ── Marcas ────────────────────────────────────────────────────────────────

export const listBrands = () =>
  prisma.brand.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { models: true, vehicles: true } } } });

export const findBrandById = (id: string) => prisma.brand.findUnique({ where: { id } });
export const findBrandBySlug = (slug: string) => prisma.brand.findUnique({ where: { slug } });

export const createBrand = (data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>) =>
  prisma.brand.create({ data });

export const updateBrand = (id: string, data: Partial<Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>>) =>
  prisma.brand.update({ where: { id }, data });

export const deleteBrand = (id: string) => prisma.brand.delete({ where: { id } });

// ── Modelos ───────────────────────────────────────────────────────────────

export const listModels = (brandId?: string) =>
  prisma.model.findMany({
    where: brandId ? { brandId } : undefined,
    orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
    include: { brand: { select: { name: true } }, _count: { select: { vehicles: true } } },
  });

export const findModelById = (id: string) => prisma.model.findUnique({ where: { id } });

export const createModel = (data: Omit<Model, 'id' | 'createdAt' | 'updatedAt'>) =>
  prisma.model.create({ data });

export const updateModel = (id: string, data: Partial<Omit<Model, 'id' | 'createdAt' | 'updatedAt'>>) =>
  prisma.model.update({ where: { id }, data });

export const deleteModel = (id: string) => prisma.model.delete({ where: { id } });

// ── Equipamentos ──────────────────────────────────────────────────────────

export const listEquipment = () =>
  prisma.equipmentItem.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });

export const findEquipmentById = (id: string) => prisma.equipmentItem.findUnique({ where: { id } });

export const createEquipment = (data: Omit<EquipmentItem, 'id' | 'createdAt' | 'updatedAt'>) =>
  prisma.equipmentItem.create({ data });

export const updateEquipment = (id: string, data: Partial<Omit<EquipmentItem, 'id' | 'createdAt' | 'updatedAt'>>) =>
  prisma.equipmentItem.update({ where: { id }, data });

export const deleteEquipment = (id: string) => prisma.equipmentItem.delete({ where: { id } });

// ── Badges ────────────────────────────────────────────────────────────────

export const listBadges = () => prisma.badge.findMany({ orderBy: { label: 'asc' } });
export const findBadgeById = (id: string) => prisma.badge.findUnique({ where: { id } });
export const createBadge = (data: Omit<Badge, 'id' | 'createdAt' | 'updatedAt'>) => prisma.badge.create({ data });
export const updateBadge = (id: string, data: Partial<Omit<Badge, 'id' | 'createdAt' | 'updatedAt'>>) =>
  prisma.badge.update({ where: { id }, data });

// ── Sinónimos ─────────────────────────────────────────────────────────────

export const listSynonyms = () => prisma.searchSynonym.findMany({ orderBy: { term: 'asc' } });
export const findSynonymById = (id: string) => prisma.searchSynonym.findUnique({ where: { id } });
export const createSynonym = (data: Omit<SearchSynonym, 'id' | 'createdAt' | 'updatedAt'>) =>
  prisma.searchSynonym.create({ data });
export const updateSynonym = (id: string, data: Partial<Omit<SearchSynonym, 'id' | 'createdAt' | 'updatedAt'>>) =>
  prisma.searchSynonym.update({ where: { id }, data });
export const deleteSynonym = (id: string) => prisma.searchSynonym.delete({ where: { id } });

/** Dicionário completo para o parser de pesquisa (endpoint público). */
export async function getParserDictionary() {
  const [brands, synonyms] = await Promise.all([
    prisma.brand.findMany({
      where: { active: true },
      select: { name: true, slug: true, aliases: true, models: { where: { active: true }, select: { name: true, slug: true, aliases: true } } },
    }),
    prisma.searchSynonym.findMany({ where: { active: true } }),
  ]);
  return { brands, synonyms };
}
