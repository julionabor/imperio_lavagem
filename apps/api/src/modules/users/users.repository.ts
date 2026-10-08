import { prisma } from '../../shared/prisma-client.ts';
import type { UserRole } from '@prisma/client';
import { toSkipTake } from '../../shared/pagination.ts';

export const listUsers = (page = 1, pageSize = 20) => {
  const { skip, take } = toSkipTake(page, pageSize);
  return prisma.$transaction([
    prisma.user.findMany({
      skip, take,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, role: true, active: true, lastLoginAt: true, createdAt: true },
    }),
    prisma.user.count(),
  ]);
};

export const findUserById = (id: string) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, active: true, lastLoginAt: true, createdAt: true },
  });

export const createUser = (data: {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}) => prisma.user.create({ data });

export const updateUser = (id: string, data: Partial<{
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
}>) => prisma.user.update({ where: { id }, data });
