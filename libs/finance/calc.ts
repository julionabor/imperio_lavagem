/**
 * Cálculo de financiamento — sistema francês (prestação constante).
 *
 * Todas as funções trabalham em **cêntimos** (int) para preços/valores monetários
 * e em **pontos base** (int) para taxas (1 % = 100 bp).
 *
 * Dois modos:
 * - TAEG_INPUT  → taxa mensal i = (1 + TAEG)^(1/12) − 1  (protótipo: TAEG 15 %)
 * - TAN_AND_FEES → taxa mensal i = TAN / 12
 *
 * Fonte de verdade: prototype-logic.js + SPEC §4.3.
 */

// ── Taxa mensal ────────────────────────────────────────────────────────────

/**
 * Taxa mensal equivalente a partir da TAEG.
 * Equivalente a `let IM = Math.pow(1.15, 1/12) - 1` do protótipo com TAEG 15 %.
 */
export function taegToMonthlyRate(taegBp: number): number {
  return Math.pow(1 + taegBp / 10_000, 1 / 12) - 1;
}

/**
 * Taxa mensal a partir da TAN (divisão simples por 12).
 */
export function tanToMonthlyRate(tanBp: number): number {
  return tanBp / 10_000 / 12;
}

/**
 * TAN implícita a partir da taxa mensal (arredondada a bp inteiros).
 * Usada no modo TAEG_INPUT para mostrar a "TAN fixa" equivalente.
 */
export function monthlyRateToImpliedTanBp(monthlyRate: number): number {
  return Math.round(monthlyRate * 12 * 10_000);
}

// ── Prestação mensal ───────────────────────────────────────────────────────

/**
 * Prestação mensal em cêntimos (float — arredonde com Math.round para exibição).
 *
 * P = C × i / (1 − (1 + i)^(−n))
 *
 * Equivalente a `pay(price, e, n)` do protótipo mas operando em cêntimos.
 */
export function calcMonthlyPayment(
  priceCents: number,
  entryCents: number,
  termMonths: number,
  monthlyRate: number,
): number {
  const principal = Math.max(0, priceCents - entryCents);
  if (principal === 0 || termMonths === 0) return 0;
  // Taxa 0: prestação = capital / prazo (limite da fórmula quando i→0)
  if (monthlyRate === 0) return principal / termMonths;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
}

// ── Resultado completo ─────────────────────────────────────────────────────

export interface FinancingCalcResult {
  /** Montante financiado em cêntimos */
  principalCents: number;
  /** Prestação mensal em cêntimos (float — não arredondada) */
  monthlyPaymentCents: number;
  /** Prestação mensal arredondada ao cêntimo */
  monthlyPaymentRounded: number;
  /** MTIC (prestação × n) em cêntimos */
  mticCents: number;
  /** Total de juros em cêntimos */
  interestCents: number;
  /** Taxa mensal usada */
  monthlyRate: number;
}

/**
 * Simulação completa de financiamento.
 *
 * Equivalente a `fin(price, e, n)` do protótipo mas em cêntimos.
 * `fin` retornava { P, m, mtic, juros } — aqui é { principalCents, monthlyPaymentCents, mticCents, interestCents }.
 */
export function calcFinancing(
  priceCents: number,
  entryCents: number,
  termMonths: number,
  monthlyRate: number,
): FinancingCalcResult {
  const principalCents = Math.max(0, priceCents - entryCents);
  const monthlyPaymentCents = calcMonthlyPayment(priceCents, entryCents, termMonths, monthlyRate);
  const monthlyPaymentRounded = Math.round(monthlyPaymentCents);
  const mticCents = monthlyPaymentCents * termMonths;
  const interestCents = mticCents - principalCents;
  return {
    principalCents,
    monthlyPaymentCents,
    monthlyPaymentRounded,
    mticCents,
    interestCents,
    monthlyRate,
  };
}

// ── Conveniências por modo ─────────────────────────────────────────────────

/** Simulação em modo TAEG_INPUT (protótipo: TAEG 15 %). */
export function calcFinancingTaeg(
  priceCents: number,
  entryCents: number,
  termMonths: number,
  taegBp: number,
): FinancingCalcResult {
  return calcFinancing(priceCents, entryCents, termMonths, taegToMonthlyRate(taegBp));
}

/** Simulação em modo TAN_AND_FEES. */
export function calcFinancingTan(
  priceCents: number,
  entryCents: number,
  termMonths: number,
  tanBp: number,
): FinancingCalcResult {
  return calcFinancing(priceCents, entryCents, termMonths, tanToMonthlyRate(tanBp));
}
