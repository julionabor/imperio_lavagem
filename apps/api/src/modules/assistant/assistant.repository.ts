import { prisma } from '../../shared/prisma-client.ts';

export const getAssistantSettings = () =>
  prisma.assistantSettings.findFirst({
    include: { steps: { orderBy: { position: 'asc' } } },
  });

export const upsertAssistantSettings = async (data: Record<string, unknown>) => {
  const existing = await prisma.assistantSettings.findFirst();
  if (existing) {
    return prisma.assistantSettings.update({
      where: { id: existing.id },
      data,
      include: { steps: { orderBy: { position: 'asc' } } },
    });
  }
  return prisma.assistantSettings.create({
    data: data as never,
    include: { steps: { orderBy: { position: 'asc' } } },
  });
};

export const listSteps = (settingsId: string) =>
  prisma.assistantStep.findMany({
    where: { settingsId },
    orderBy: { position: 'asc' },
  });

export const createStep = (data: {
  settingsId: string;
  key: string;
  question: string;
  position: number;
  options: object;
}) => prisma.assistantStep.create({ data });

export const updateStep = (id: string, data: Partial<{
  key: string; question: string; position: number; options: object;
}>) => prisma.assistantStep.update({ where: { id }, data });

export const deleteStep = (id: string) => prisma.assistantStep.delete({ where: { id } });

export const reorderSteps = (orderedIds: string[]) =>
  prisma.$transaction(
    orderedIds.map((id, idx) => prisma.assistantStep.update({ where: { id }, data: { position: idx } })),
  );

/** Busca viaturas publicadas para a recomendação. */
export const getPublishedVehiclesForRecommend = () =>
  prisma.vehicle.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      priceCents: true,
      fuel: true,
      bodyType: true,
      brand: { select: { name: true } },
      model: { select: { name: true } },
      images: { where: { isCover: true }, take: 1, select: { variants: true, alt: true } },
    },
  });
