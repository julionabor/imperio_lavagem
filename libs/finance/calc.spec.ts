import { describe, it, expect } from 'vitest';
import {
  taegToMonthlyRate,
  tanToMonthlyRate,
  monthlyRateToImpliedTanBp,
  calcMonthlyPayment,
  calcFinancing,
  calcFinancingTaeg,
  calcFinancingTan,
} from './calc.ts';

// ── Referência do protótipo ────────────────────────────────────────────────
// Reproduz as funções originais do protótipo em euros para gerar os valores
// esperados. Todos os testes validam que a nossa lib (em cêntimos) produz
// os mesmos valores "ao cêntimo".

const PROTOTYPE_IM = Math.pow(1.15, 1 / 12) - 1;

function protoPayEur(priceEur: number, entryEur: number, n: number): number {
  const P = Math.max(0, priceEur - entryEur);
  return (P * PROTOTYPE_IM) / (1 - Math.pow(1 + PROTOTYPE_IM, -n));
}

function protoFinEur(priceEur: number, entryEur: number, n: number) {
  const P = Math.max(0, priceEur - entryEur);
  const m = protoPayEur(priceEur, entryEur, n);
  return { P, m, mtic: m * n, juros: m * n - P };
}

// 20 viaturas do protótipo — preços em euros conforme prototype-logic.js
const CARS_EUR = [
  { id: 1, price: 26900 },
  { id: 2, price: 31500 },
  { id: 3, price: 15900 },
  { id: 4, price: 29900 },
  { id: 5, price: 25400 },
  { id: 6, price: 32900 },
  { id: 7, price: 22900 },
  { id: 8, price: 16900 },
  { id: 9, price: 38900 },
  { id: 10, price: 33900 },
  { id: 11, price: 19400 },
  { id: 12, price: 18900 },
  { id: 13, price: 52900 },
  { id: 14, price: 18400 },
  { id: 15, price: 41900 },
  { id: 16, price: 34500 },
  { id: 17, price: 21900 },
  { id: 18, price: 10900 },
  { id: 19, price: 11900 },
  { id: 20, price: 17500 },
];

const TAEG_BP = 1500; // 15 % = 1500 pontos base (protótipo)
const DEFAULT_ENTRY = 0;
const DEFAULT_TERM = 96;

// ── taegToMonthlyRate ──────────────────────────────────────────────────────

describe('taegToMonthlyRate', () => {
  it('corresponde ao IM do protótipo para TAEG 15 %', () => {
    const rate = taegToMonthlyRate(TAEG_BP);
    expect(rate).toBeCloseTo(PROTOTYPE_IM, 15);
  });

  it('TAEG 0 % dá taxa 0', () => {
    expect(taegToMonthlyRate(0)).toBe(0);
  });
});

// ── tanToMonthlyRate ───────────────────────────────────────────────────────

describe('tanToMonthlyRate', () => {
  it('TAN 12 % dá 1 % ao mês', () => {
    expect(tanToMonthlyRate(1200)).toBeCloseTo(0.01, 10);
  });
});

// ── monthlyRateToImpliedTanBp ──────────────────────────────────────────────

describe('monthlyRateToImpliedTanBp', () => {
  it('taxa mensal 1 % → TAN 12 %', () => {
    expect(monthlyRateToImpliedTanBp(0.01)).toBe(1200);
  });
});

// ── calcMonthlyPayment ─────────────────────────────────────────────────────

describe('calcMonthlyPayment — bate ao cêntimo com prototype pay()', () => {
  const rate = taegToMonthlyRate(TAEG_BP);

  for (const car of CARS_EUR) {
    it(`viatura #${car.id} — preço ${car.price} €`, () => {
      const expected = protoPayEur(car.price, DEFAULT_ENTRY, DEFAULT_TERM);
      const priceCents = car.price * 100;
      const result = calcMonthlyPayment(priceCents, DEFAULT_ENTRY, DEFAULT_TERM, rate);

      // Resultado em cêntimos; expected em euros → converter e comparar ao cêntimo
      expect(Math.round(result)).toBe(Math.round(expected * 100));
    });
  }

  it('montante 0 → prestação 0', () => {
    expect(calcMonthlyPayment(0, 0, 96, rate)).toBe(0);
  });

  it('entrada = preço → prestação 0', () => {
    expect(calcMonthlyPayment(10_000_00, 10_000_00, 96, rate)).toBe(0);
  });

  it('taxa 0 → prestação = capital / prazo (sem juros)', () => {
    const priceCents = 10_000_00; // 1 000 €
    expect(calcMonthlyPayment(priceCents, 0, 96, 0)).toBeCloseTo(priceCents / 96, 5);
  });
});

// ── calcFinancing ──────────────────────────────────────────────────────────

describe('calcFinancing — bate ao cêntimo com prototype fin()', () => {
  const rate = taegToMonthlyRate(TAEG_BP);

  for (const car of CARS_EUR) {
    it(`viatura #${car.id} — preço ${car.price} €`, () => {
      const ref = protoFinEur(car.price, DEFAULT_ENTRY, DEFAULT_TERM);
      const priceCents = car.price * 100;
      const res = calcFinancing(priceCents, DEFAULT_ENTRY, DEFAULT_TERM, rate);

      // P (montante financiado)
      expect(res.principalCents).toBe(Math.round(ref.P * 100));

      // prestação mensal ao cêntimo
      expect(Math.round(res.monthlyPaymentCents)).toBe(Math.round(ref.m * 100));
      expect(res.monthlyPaymentRounded).toBe(Math.round(ref.m * 100));

      // MTIC ao cêntimo
      expect(Math.round(res.mticCents)).toBe(Math.round(ref.mtic * 100));

      // juros ao cêntimo
      expect(Math.round(res.interestCents)).toBe(Math.round(ref.juros * 100));
    });
  }
});

// ── calcFinancingTaeg ─────────────────────────────────────────────────────

describe('calcFinancingTaeg', () => {
  it('equivalente a calcFinancing com taegToMonthlyRate', () => {
    const rate = taegToMonthlyRate(TAEG_BP);
    const ref = calcFinancing(2690000, 0, 96, rate);
    const res = calcFinancingTaeg(2690000, 0, 96, TAEG_BP);
    expect(res.monthlyPaymentRounded).toBe(ref.monthlyPaymentRounded);
  });

  it('com entrada de 20 % reduz o montante financiado', () => {
    const priceCents = 2690000; // 26 900 €
    const entryCents = 538000; // 20 % de 26 900 € = 5 380 €
    const res = calcFinancingTaeg(priceCents, entryCents, 96, TAEG_BP);
    expect(res.principalCents).toBe(priceCents - entryCents);
    expect(res.monthlyPaymentCents).toBeLessThan(
      calcFinancingTaeg(priceCents, 0, 96, TAEG_BP).monthlyPaymentCents,
    );
  });

  it('prazo mais curto aumenta a prestação', () => {
    const r96 = calcFinancingTaeg(2690000, 0, 96, TAEG_BP);
    const r24 = calcFinancingTaeg(2690000, 0, 24, TAEG_BP);
    expect(r24.monthlyPaymentCents).toBeGreaterThan(r96.monthlyPaymentCents);
  });

  it('prazo mais curto reduz os juros totais', () => {
    const r96 = calcFinancingTaeg(2690000, 0, 96, TAEG_BP);
    const r24 = calcFinancingTaeg(2690000, 0, 24, TAEG_BP);
    expect(r24.interestCents).toBeLessThan(r96.interestCents);
  });
});

// ── calcFinancingTan ──────────────────────────────────────────────────────

describe('calcFinancingTan', () => {
  it('TAN 0 % → prestação = capital / n', () => {
    const priceCents = 1200000; // 12 000 €
    const n = 12;
    const res = calcFinancingTan(priceCents, 0, n, 0);
    // Com taxa 0 a prestação é simplesmente capital / prazo
    expect(res.monthlyPaymentRounded).toBe(Math.round(priceCents / n));
  });

  it('TAN 12 % (1200 bp) difere de TAEG 12 % (1200 bp) pelo efeito de capitalização', () => {
    const price = 1000000;
    const resTan = calcFinancingTan(price, 0, 12, 1200);
    const resTaeg = calcFinancingTaeg(price, 0, 12, 1200);
    // TAN/12 (1 %/mês) > (1+TAEG)^(1/12)-1 (≈0.949 %/mês) → prestação TAN > prestação TAEG
    expect(resTan.monthlyPaymentCents).toBeGreaterThan(resTaeg.monthlyPaymentCents);
  });
});
