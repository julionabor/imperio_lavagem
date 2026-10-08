import { randomBytes } from 'node:crypto';
import { verifyPassword, hashPassword } from '../../shared/password.ts';
import { sendMail } from '../../shared/mailer.ts';
import * as repo from './auth.repository.ts';
import type { User } from '@prisma/client';

/** Tentativas falhadas em memória (em produção seria Redis). */
const failedAttempts = new Map<string, { count: number; lockedUntil?: Date }>();

export interface LoginResult {
  user: User;
  refreshTokenRaw: string;
}

export async function login(email: string, password: string): Promise<LoginResult | null> {
  const state = failedAttempts.get(email);
  if (state?.lockedUntil && state.lockedUntil > new Date()) return null;

  const user = await repo.findUserByEmail(email);
  if (!user || !user.active) {
    recordFailure(email);
    return null;
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    recordFailure(email);
    return null;
  }

  // Login bem-sucedido — limpa tentativas
  failedAttempts.delete(email);
  await repo.updateLastLogin(user.id);
  const refreshTokenRaw = await repo.createRefreshToken(user.id);
  return { user, refreshTokenRaw };
}

function recordFailure(email: string): void {
  const state = failedAttempts.get(email) ?? { count: 0 };
  state.count++;
  if (state.count >= 5) {
    state.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // bloqueia 15 min
    state.count = 0;
  }
  failedAttempts.set(email, state);
}

export async function refresh(rawToken: string): Promise<{ user: User; refreshTokenRaw: string } | null> {
  // Valida o token antigo
  const userId = await repo.validateRefreshToken(rawToken);
  if (!userId) return null;

  const user = await repo.findUserById(userId);
  if (!user || !user.active) return null;

  // Rotação: revoga o antigo, cria um novo
  const newRaw = await repo.rotateRefreshToken(rawToken, userId);
  if (!newRaw) return null;

  return { user, refreshTokenRaw: newRaw };
}

export async function logout(rawToken: string): Promise<void> {
  await repo.revokeRefreshToken(rawToken);
}

export async function forgotPassword(email: string, baseUrl: string): Promise<void> {
  const user = await repo.findUserByEmail(email);
  if (!user || !user.active) return; // Não revelar se o email existe

  const token = randomBytes(32).toString('hex');
  await repo.savePasswordResetToken(user.id, token);

  const link = `${baseUrl}/admin/reset-password?token=${token}`;
  await sendMail({
    to: email,
    subject: 'Recuperação de password — Private Motors',
    text: `Clique no link para redefinir a sua password:\n\n${link}\n\nValidade: 30 minutos.`,
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const userId = await repo.validatePasswordResetToken(token);
  if (!userId) return false;

  const hash = await hashPassword(newPassword);
  await repo.updatePassword(userId, hash);
  await repo.consumePasswordResetToken(token);
  return true;
}
