/** Hash e verificação de passwords com crypto.scrypt (Node nativo). */
import { scrypt, timingSafeEqual, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const KEYLEN = 64;

/**
 * Gera hash de uma password.
 * Formato: salt:hash (hex)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

/**
 * Verifica uma password contra o hash armazenado.
 * Usa timingSafeEqual para evitar timing attacks.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, 'hex');
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  if (derived.length !== hashBuffer.length) return false;
  return timingSafeEqual(derived, hashBuffer);
}
