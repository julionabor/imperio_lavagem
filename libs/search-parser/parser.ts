/**
 * Parser de pesquisa inteligente.
 *
 * Porta fiel de parse(), merge(), chipList(), removeChip() do protótipo.
 * Valores monetários em cêntimos (int) conforme as regras do projeto.
 * Valores de km mantêm-se em km (não são dinheiro).
 *
 * Fonte: prototype-logic.js + SPEC §4.2 RF-P01.
 */

import type { FilterState } from '../contracts/vehicle.ts';

// ── Helpers internos ───────────────────────────────────────────────────────

/** Normaliza para comparações: lowercase + remove acentos. */
function norm(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Formata número com separador de milhares (espaço narrow U+202F). */
function grp(v: number): string {
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
}

/** Formata euros (sem cêntimos). */
function eur(cents: number): string {
  return grp(cents / 100) + '\u00a0€';
}

/** Formata km. */
function km(v: number): string {
  return grp(v) + '\u00a0km';
}

// ── FilterState vazio ──────────────────────────────────────────────────────

export function emptyFilter(): FilterState {
  return {
    brand: '',
    model: '',
    priceMax: null,
    monthlyMax: null,
    yearMin: null,
    kmMax: null,
    fuel: [],
    gear: '',
    body: [],
  };
}

// ── Tipo de chip ───────────────────────────────────────────────────────────

export interface Chip {
  /** Chave do campo no FilterState */
  k: keyof FilterState;
  /** Valor específico (para arrays fuel/body) */
  v?: string;
  /** Label para exibir ao utilizador */
  label: string;
}

// ── parse ─────────────────────────────────────────────────────────────────

/**
 * Converte texto livre em FilterState.
 * Valores monetários em cêntimos; km em km.
 *
 * @param q - Texto introduzido pelo utilizador
 * @param brandNames - Nomes de marcas do catálogo (case-insensitive)
 * @param modelEntries - Pares { brand, model } do catálogo
 */
export function parse(
  q: string,
  brandNames: string[] = [],
  modelEntries: Array<{ brand: string; model: string }> = [],
): FilterState {
  const f = emptyFilter();
  if (!q || !q.trim()) return f;
  let s = ' ' + norm(q) + ' ';

  /** Converte string numérica (com pontos de milhar) e sufixo k/mil → número em euros. */
  const num = (a: string, k: string | undefined): number => {
    let v = parseFloat(a.replace(/[\s.]/g, '').replace(',', '.'));
    if (k) v *= 1000;
    return v;
  };

  // km: "60 000 km", "60.000km", "60k km"
  let m = s.match(/(\d[\d.\s]*\d|\d)\s*(k|mil)?\s*km/);
  if (m) {
    f.kmMax = Math.round(num(m[1], m[2]));
    s = s.replace(m[0], ' ');
  }

  // prestação mensal: "250€/mês", "250 euros por mês"
  m = s.match(/(\d+)\s*(?:€|eur|euros)?\s*(?:\/|por|ao|a)\s*mes/);
  if (m) {
    f.monthlyMax = Math.round(+m[1] * 100);
    s = s.replace(m[0], ' ');
  }

  // ano mínimo: "desde 2020", "a partir de 2019", ou simplesmente "2020"
  m =
    s.match(/(?:desde|depois de|a partir de|posterior a)\s*(20[0-2]\d)/) ||
    s.match(/\b(20[12]\d)\b/);
  if (m) {
    f.yearMin = +m[1];
    s = s.replace(m[0], ' ');
  }

  // preço/prestação máxima genérica: "até 25 mil euros", "até 250"
  m = s.match(/(?:ate|max|maximo|menos de|abaixo de)\s*(\d[\d.\s]*\d|\d)\s*(k|mil)?/);
  if (m) {
    const v = num(m[1], m[2]);
    if (v < 1500) {
      f.monthlyMax = f.monthlyMax ?? Math.round(v * 100);
    } else {
      f.priceMax = Math.round(v * 100);
    }
  }

  // combustível
  if (/diesel|gasoleo/.test(s)) f.fuel.push('Diesel');
  if (/plug|phev/.test(s)) f.fuel.push('Plug-in');
  else if (/hibrid/.test(s)) f.fuel.push('Híbrido');
  if (/gasolina/.test(s)) f.fuel.push('Gasolina');
  if (/eletric|\bev\b/.test(s)) f.fuel.push('Elétrico');

  // carroçaria
  if (/suv|jipe|crossover/.test(s)) f.body.push('SUV');
  if (/carrinha|station|touring|break|familiar/.test(s)) f.body.push('Carrinha');
  if (/berlina|sedan|hatch/.test(s)) f.body.push('Berlina');
  if (/utilitario|citadino|pequeno/.test(s)) f.body.push('Utilitário');
  if (/coupe|desportivo/.test(s)) f.body.push('Coupé');

  // caixa
  if (/automatic|\bauto\b|dsg/.test(s)) f.gear = 'Automática';
  else if (/manual/.test(s)) f.gear = 'Manual';

  // marca — do catálogo ou fallback de marcas conhecidas
  const allBrands = brandNames.length > 0 ? brandNames : FALLBACK_BRANDS;
  for (const b of allBrands) {
    const nb = norm(b);
    if (
      s.includes(nb) ||
      (nb === 'mercedes-benz' && s.includes('mercedes')) ||
      (nb === 'volkswagen' && /\bvw\b/.test(s))
    ) {
      f.brand = b;
    }
  }

  // modelo — do catálogo
  const allModels = modelEntries.length > 0 ? modelEntries : FALLBACK_MODELS;
  for (const entry of allModels) {
    const w = norm(entry.model).split(' ')[0];
    if (
      w.length > 2 &&
      !['serie', 'classe', 'model'].includes(w) &&
      new RegExp('\\b' + w + '\\b').test(s)
    ) {
      f.brand = entry.brand;
      f.model = entry.model;
    }
  }

  return f;
}

// ── merge ─────────────────────────────────────────────────────────────────

/**
 * Combina um FilterState base (F) com filtros novos do parser (P).
 * Os valores de P têm precedência; arrays são unidos sem duplicados.
 */
export function merge(F: FilterState, P: FilterState): FilterState {
  return {
    brand: P.brand || F.brand,
    model: P.model || F.model,
    priceMax: P.priceMax ?? F.priceMax,
    monthlyMax: P.monthlyMax ?? F.monthlyMax,
    yearMin: P.yearMin ?? F.yearMin,
    kmMax: P.kmMax ?? F.kmMax,
    fuel: uniq([...F.fuel, ...P.fuel]),
    gear: P.gear || F.gear,
    body: uniq([...F.body, ...P.body]),
  };
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// ── chipList ──────────────────────────────────────────────────────────────

/**
 * Gera a lista de chips visíveis a partir de um FilterState.
 * Equivalente a chipList() do protótipo.
 */
export function chipList(F: FilterState): Chip[] {
  const out: Chip[] = [];
  if (F.brand) out.push({ k: 'brand', label: F.brand });
  if (F.model) out.push({ k: 'model', label: F.model });
  if (F.priceMax != null) out.push({ k: 'priceMax', label: 'Até ' + eur(F.priceMax) });
  if (F.monthlyMax != null)
    out.push({ k: 'monthlyMax', label: 'Até ' + eur(F.monthlyMax) + '/mês' });
  if (F.yearMin != null) out.push({ k: 'yearMin', label: 'Desde ' + F.yearMin });
  if (F.kmMax != null) out.push({ k: 'kmMax', label: 'Até ' + km(F.kmMax) });
  F.fuel.forEach((v) => out.push({ k: 'fuel', v, label: v }));
  if (F.gear) out.push({ k: 'gear', label: F.gear });
  F.body.forEach((v) => out.push({ k: 'body', v, label: v }));
  return out;
}

// ── removeChip ────────────────────────────────────────────────────────────

/**
 * Remove um chip do FilterState.
 * Remover a marca também apaga o modelo.
 */
export function removeChip(F: FilterState, ch: Pick<Chip, 'k' | 'v'>): FilterState {
  const G: FilterState = { ...F, fuel: [...F.fuel], body: [...F.body] };
  if (ch.k === 'fuel' || ch.k === 'body') {
    (G[ch.k] as string[]) = (G[ch.k] as string[]).filter((x) => x !== ch.v);
  } else if (ch.k === 'brand') {
    G.brand = '';
    G.model = '';
  } else if (ch.k === 'model' || ch.k === 'gear') {
    G[ch.k] = '';
  } else if (ch.k === 'priceMax' || ch.k === 'monthlyMax' || ch.k === 'yearMin' || ch.k === 'kmMax') {
    G[ch.k] = null;
  }
  return G;
}

// ── Catálogo de fallback (protótipo) ──────────────────────────────────────
// Usado quando não há catálogo da API disponível (ex.: testes unitários).

const FALLBACK_BRANDS = [
  'Audi',
  'BMW',
  'Citroën',
  'Dacia',
  'Fiat',
  'Honda',
  'Hyundai',
  'Kia',
  'Mercedes-Benz',
  'Mini',
  'Nissan',
  'Peugeot',
  'Porsche',
  'Renault',
  'Seat',
  'Skoda',
  'Tesla',
  'Toyota',
  'Volkswagen',
  'Volvo',
];

const FALLBACK_MODELS = [
  { brand: 'Peugeot', model: '3008' },
  { brand: 'BMW', model: 'Série 3 Touring' },
  { brand: 'Renault', model: 'Clio' },
  { brand: 'Mercedes-Benz', model: 'Classe A' },
  { brand: 'Volkswagen', model: 'Golf' },
  { brand: 'Tesla', model: 'Model 3' },
  { brand: 'Toyota', model: 'C-HR' },
  { brand: 'Skoda', model: 'Octavia Break' },
  { brand: 'Audi', model: 'Q3 Sportback' },
  { brand: 'Volvo', model: 'XC40' },
  { brand: 'Kia', model: 'Sportage' },
  { brand: 'Mini', model: 'Cooper' },
  { brand: 'Porsche', model: 'Macan' },
  { brand: 'Dacia', model: 'Duster' },
  { brand: 'BMW', model: 'Série 4 Coupé' },
  { brand: 'Hyundai', model: 'Tucson' },
  { brand: 'Fiat', model: '500' },
  { brand: 'Citroën', model: 'C3' },
  { brand: 'Dacia', model: 'Sandero Stepway' },
  { brand: 'Renault', model: 'Captur' },
];
