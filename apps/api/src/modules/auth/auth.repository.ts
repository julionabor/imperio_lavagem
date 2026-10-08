import { prisma } from '../../shared/prisma-client.ts';
import { createHash, randomBytes } from 'node:crypto';
import type { User } from '@prisma/client';

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function updateLastLogin(id: string): Promise<void> {
  await prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
}

// ── Refresh tokens ────────────────────────────────────────────────────────

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createRefreshToken(userId: string): Promise<string> {
  const raw = randomBytes(40).toString('hex');
  const hash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
  await prisma.refreshToken.create({ data: { userId, tokenHash: hash, expiresAt } });
  return raw;
}

export async function rotateRefreshToken(
  oldRaw: string,
  userId: string,
): Promise<string | null> {
  const oldHash = hashToken(oldRaw);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash: oldHash } });
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) return null;
  if (existing.userId !== userId) return null;

  // Revogar o token antigo
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return createRefreshToken(userId);
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  const hash = hashToken(raw);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash },
    data: { revokedAt: new Date() },
  });
}

export async function validateRefreshToken(raw: string): Promise<string | null> {
  const hash = hashToken(raw);
  const token = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
  if (!token || token.revokedAt || token.expiresAt < new Date()) return null;
  return token.userId;
}

// ── Password reset ────────────────────────────────────────────────────────

/** Guarda um token de reset de password (hash SHA-256, validade 30 min). */
export async function savePasswordResetToken(
  userId: string,
  token: string,
): Promise<void> {
  // Reutilizamos RefreshToken com um prefixo especial no hash para distinguir
  const hash = 'reset:' + createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  // Revoga resets anteriores
  await prisma.refreshToken.updateMany({
    where: { userId, tokenHash: { startsWith: 'reset:' } },
    data: { revokedAt: new Date() },
  });
  await prisma.refreshToken.create({ data: { userId, tokenHash: hash, expiresAt } });
}

export async function validatePasswordResetToken(token: string): Promise<string | null> {
  const hash = 'reset:' + createHash('sha256').update(token).digest('hex');
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
  if (!record || record.revokedAt || record.expiresAt < new Date()) return null;
  return record.userId;
}

export async function consumePasswordResetToken(token: string): Promise<void> {
  const hash = 'reset:' + createHash('sha256').update(token).digest('hex');
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash },
    data: { revokedAt: new Date() },
  });
}

export async function updatePassword(userId: string, passwordHash: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
