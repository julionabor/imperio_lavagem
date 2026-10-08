import { prisma } from '../../shared/prisma-client.ts';

export const getSettings = () => prisma.siteSettings.findFirst();

export const upsertSettings = async (data: Record<string, unknown>) => {
  const existing = await prisma.siteSettings.findFirst();
  if (existing) {
    return prisma.siteSettings.update({ where: { id: existing.id }, data });
  }
  return prisma.siteSettings.create({ data: data as never });
};
