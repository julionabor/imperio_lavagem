/** Helper para registar entradas no log de auditoria. */
import { prisma } from './prisma-client.ts';
import type { Prisma } from '@prisma/client';

export async function auditLog(opts: {
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string;
  diff: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: opts.userId,
      action: opts.action,
      entity: opts.entity,
      entityId: opts.entityId,
      diff: opts.diff as Prisma.InputJsonValue,
    },
  });
}
