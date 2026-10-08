import { prisma } from '../../shared/prisma-client.ts';
import type { PlacementZone } from '@prisma/client';

const vehicleInclude = {
  brand: { select: { name: true } },
  model: { select: { name: true } },
  images: {
    where: { isCover: true },
    take: 1,
    select: { id: true, variants: true, alt: true },
  },
  financingProduct: true,
} as const;

export async function getFeaturedByPlacement(placement: PlacementZone) {
  const now = new Date();
  return prisma.featuredPlacement.findMany({
    where: {
      placement,
      active: true,
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }],
      vehicle: { status: { in: ['PUBLISHED', 'RESERVED'] } },
    },
    orderBy: { position: 'asc' },
    include: { vehicle: { include: vehicleInclude } },
  });
}

export async function setFeaturedPlacement(
  placement: PlacementZone,
  vehicleIds: string[],
  userId?: string,
) {
  await prisma.$transaction([
    // Desativa todos os existentes para este placement
    prisma.featuredPlacement.updateMany({
      where: { placement },
      data: { active: false },
    }),
    // Cria os novos
    prisma.featuredPlacement.createMany({
      data: vehicleIds.map((vehicleId, position) => ({
        vehicleId,
        placement,
        position,
        active: true,
      })),
    }),
  ]);
}

export const listFeaturedAdmin = (placement?: PlacementZone) =>
  prisma.featuredPlacement.findMany({
    where: placement ? { placement } : undefined,
    orderBy: [{ placement: 'asc' }, { position: 'asc' }],
    include: { vehicle: { include: vehicleInclude } },
  });
