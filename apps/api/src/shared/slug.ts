/** Geração de slugs URL-friendly. */

/**
 * Converte um texto para slug.
 * Ex.: "Volkswagen Golf 1.5 TSI 2021" → "volkswagen-golf-15-tsi-2021"
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')   // only alphanumeric, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/-+/g, '-');           // collapse multiple hyphens
}

/**
 * Gera slug para uma viatura: marca-modelo-versao-ano.
 * Se o slug já existe na DB, acrescenta um sufixo numérico.
 */
export function vehicleSlug(brand: string, model: string, version: string, year: number): string {
  return toSlug(`${brand} ${model} ${version} ${year}`);
}

/**
 * Dado um slug base e uma lista de slugs existentes,
 * devolve um slug único adicionando sufixo "-2", "-3", etc.
 */
export function uniqueSlug(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
