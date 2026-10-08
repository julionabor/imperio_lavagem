import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import * as imagesRepo from './images.repository.ts';
import * as vehiclesRepo from '../vehicles/vehicles.repository.ts';
import { saveImage, deleteImage as deleteImageFile } from '../../shared/storage.ts';
import { notFound, forbidden, unprocessable, problemFromZod } from '../../shared/errors.ts';
import { auditLog } from '../../shared/audit.ts';

const MAX_IMAGES = 40;

export async function imageRoutes(app: FastifyInstance): Promise<void> {
  // POST /admin/vehicles/:vehicleId/images  (multipart)
  app.post(
    '/admin/vehicles/:vehicleId/images',
    { preValidation: [app.authenticate] },
    async (req, rep) => {
      const user = req.user!;
      if (!['ADMIN', 'EDITOR'].includes(user.role)) return forbidden(rep);

      const { vehicleId } = req.params as { vehicleId: string };
      const vehicle = await vehiclesRepo.findVehicleById(vehicleId);
      if (!vehicle) return notFound(rep);

      const count = await imagesRepo.countImagesByVehicle(vehicleId);
      if (count >= MAX_IMAGES) {
        return unprocessable(rep, `Máximo de ${MAX_IMAGES} fotos por viatura.`);
      }

      const files = req.files();
      const created: object[] = [];

      for await (const file of files) {
        if (count + created.length >= MAX_IMAGES) break;
        const buffer = await file.toBuffer();
        const stored = await saveImage(buffer);
        const position = count + created.length;
        const isCover = position === 0; // primeira foto é capa se não houver nenhuma

        const image = await imagesRepo.createImage({
          vehicleId,
          storageKey: stored.storageKey,
          variants: stored.variants,
          alt: file.filename ?? '',
          position,
          isCover: isCover && count === 0,
          width: stored.width,
          height: stored.height,
        });
        created.push(image);
      }

      await auditLog({
        userId: user.id,
        action: 'CREATE',
        entity: 'VehicleImage',
        entityId: vehicleId,
        diff: { count: created.length },
      });
      return rep.status(201).send(created);
    },
  );

  // PATCH /admin/vehicles/:vehicleId/images/reorder
  app.patch(
    '/admin/vehicles/:vehicleId/images/reorder',
    { preValidation: [app.authenticate] },
    async (req, rep) => {
      const user = req.user!;
      if (!['ADMIN', 'EDITOR'].includes(user.role)) return forbidden(rep);

      const { vehicleId } = req.params as { vehicleId: string };
      const schema = z.object({ ids: z.array(z.string().uuid()) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return problemFromZod(rep, parsed.error);

      await imagesRepo.reorderImages(vehicleId, parsed.data.ids);
      return rep.status(204).send();
    },
  );

  // PATCH /admin/vehicles/:vehicleId/images/:imageId
  app.patch(
    '/admin/vehicles/:vehicleId/images/:imageId',
    { preValidation: [app.authenticate] },
    async (req, rep) => {
      const user = req.user!;
      if (!['ADMIN', 'EDITOR'].includes(user.role)) return forbidden(rep);

      const { vehicleId, imageId } = req.params as { vehicleId: string; imageId: string };
      const schema = z.object({
        alt: z.string().optional(),
        isCover: z.boolean().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return problemFromZod(rep, parsed.error);

      const image = await imagesRepo.findImageById(imageId);
      if (!image || image.vehicleId !== vehicleId) return notFound(rep);

      if (parsed.data.isCover) {
        await imagesRepo.setCoverImage(vehicleId, imageId);
      } else if (parsed.data.alt !== undefined) {
        await imagesRepo.updateImage(imageId, { alt: parsed.data.alt });
      }

      return rep.status(204).send();
    },
  );

  // DELETE /admin/vehicles/:vehicleId/images/:imageId
  app.delete(
    '/admin/vehicles/:vehicleId/images/:imageId',
    { preValidation: [app.authenticate] },
    async (req, rep) => {
      const user = req.user!;
      if (!['ADMIN', 'EDITOR'].includes(user.role)) return forbidden(rep);

      const { vehicleId, imageId } = req.params as { vehicleId: string; imageId: string };
      const image = await imagesRepo.findImageById(imageId);
      if (!image || image.vehicleId !== vehicleId) return notFound(rep);

      await imagesRepo.deleteImage(imageId);
      await deleteImageFile(image.storageKey);
      await auditLog({
        userId: user.id,
        action: 'DELETE',
        entity: 'VehicleImage',
        entityId: imageId,
        diff: {},
      });
      return rep.status(204).send();
    },
  );
}
