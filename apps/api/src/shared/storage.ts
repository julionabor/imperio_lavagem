/**
 * Interface de armazenamento de imagens + implementação em disco.
 * Processa imagens com sharp: WebP em 3 tamanhos (thumb 400w, card 800w, full 1600w).
 * Remove EXIF (incluindo GPS).
 * Serve via /uploads/:hash.webp com nome baseado em hash SHA-256.
 */
import { createHash, randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { writeFile, unlink } from 'node:fs/promises';
import sharp from 'sharp';
import { config } from '../config.ts';

export interface ImageVariants {
  thumb: string; // URL 400w
  card: string;  // URL 800w
  full: string;  // URL 1600w
}

export interface StoredImage {
  storageKey: string;
  variants: ImageVariants;
  width: number;
  height: number;
}

/** Prefixo de URL base (sem trailing slash). */
function urlBase(): string {
  return '/uploads';
}

function variantUrl(key: string, suffix: string): string {
  return `${urlBase()}/${key}-${suffix}.webp`;
}

function variantPath(key: string, suffix: string): string {
  return join(config.UPLOAD_DIR, `${key}-${suffix}.webp`);
}

/**
 * Guarda uma imagem em disco em 3 variantes WebP.
 * Devolve o storageKey (hash aleatório) e as URLs das variantes.
 */
export async function saveImage(buffer: Buffer): Promise<StoredImage> {
  const key = randomBytes(16).toString('hex');

  // Extrai metadados da imagem original (para width/height)
  const meta = await sharp(buffer).metadata();
  const origWidth = meta.width ?? 800;
  const origHeight = meta.height ?? 600;

  // Gera as 3 variantes removendo EXIF
  const sizes: [string, number][] = [
    ['thumb', 400],
    ['card', 800],
    ['full', 1600],
  ];

  await Promise.all(
    sizes.map(([suffix, w]) =>
      sharp(buffer)
        .rotate() // respeita EXIF orientation
        .resize(w, undefined, { withoutEnlargement: true })
        .withMetadata({ exif: {} }) // limpa EXIF
        .webp({ quality: 85 })
        .toFile(variantPath(key, suffix)),
    ),
  );

  return {
    storageKey: key,
    variants: {
      thumb: variantUrl(key, 'thumb'),
      card: variantUrl(key, 'card'),
      full: variantUrl(key, 'full'),
    },
    width: origWidth,
    height: origHeight,
  };
}

/**
 * Remove todas as variantes de uma imagem do disco.
 */
export async function deleteImage(storageKey: string): Promise<void> {
  const suffixes = ['thumb', 'card', 'full'];
  await Promise.all(
    suffixes.map((s) => unlink(variantPath(storageKey, s)).catch(() => undefined)),
  );
}

/**
 * Guarda um ficheiro de retoma (foto de viatura de troca).
 * Apenas guarda como WebP sem variantes — não é apresentada na grelha pública.
 */
export async function saveTradeInPhoto(buffer: Buffer): Promise<string> {
  const key = randomBytes(16).toString('hex') + '-tradein';
  const path = join(config.UPLOAD_DIR, `${key}.webp`);
  await sharp(buffer)
    .rotate()
    .resize(1200, undefined, { withoutEnlargement: true })
    .withMetadata({ exif: {} })
    .webp({ quality: 80 })
    .toFile(path);
  return key;
}

export function tradeInPhotoUrl(storageKey: string): string {
  return `${urlBase()}/${storageKey}.webp`;
}
