import { prisma } from '../../shared/prisma-client.ts';
import type { VehicleImage } from '@prisma/client';

export async function findImagesByVehicle(vehicleId: string): Promise<VehicleImage[]> {
  return prisma.vehicleImage.findMany({
    where: { vehicleId },
    orderBy: { position: 'asc' },
  });
}

export async function countImagesByVehicle(vehicleId: string): Promise<number> {
  return prisma.vehicleImage.count({ where: { vehicleId } });
}

export async function createImage(data: {
  vehicleId: string;
  storageKey: string;
  variants: object;
  alt: string;
  position: number;
  isCover: boolean;
  width: number;
  height: number;
}): Promise<VehicleImage> {
  return prisma.vehicleImage.create({ data });
}

export async function findImageById(id: string): Promise<VehicleImage | null> {
  return prisma.vehicleImage.findUnique({ where: { id } });
}

export async function updateImage(
  id: string,
  data: Partial<Pick<VehicleImage, 'alt' | 'isCover' | 'position'>>,
): Promise<VehicleImage> {
  return prisma.vehicleImage.update({ where: { id }, data });
}

export async function deleteImage(id: string): Promise<void> {
  await prisma.vehicleImage.delete({ where: { id } });
}

/** Reordena imagens: recebe lista de IDs na nova ordem. */
export async function reorderImages(
  vehicleId: string,
  orderedIds: string[],
): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, idx) =>
      prisma.vehicleImage.update({ where: { id }, data: { position: idx } }),
    ),
  );
}

/** Garante que só uma imagem é capa por viatura. */
export async function setCoverImage(vehicleId: string, imageId: string): Promise<void> {
  await prisma.$transaction([
    prisma.vehicleImage.updateMany({ where: { vehicleId }, data: { isCover: false } }),
    prisma.vehicleImage.update({ where: { id: imageId }, data: { isCover: true } }),
  ]);
}
