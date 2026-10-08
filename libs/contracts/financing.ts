import { z } from 'zod';

// ── Enums ──────────────────────────────────────────────────────────────────

export const RateMode = z.enum(['TAEG_INPUT', 'TAN_AND_FEES']);
export type RateMode = z.infer<typeof RateMode>;

// ── FinancingProduct (DTO público) ─────────────────────────────────────────

export const FinancingProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  lenderName: z.string(),
  isDefault: z.boolean(),
  rateMode: RateMode,
  /** TAEG em pontos base (1 % = 100). Usado em TAEG_INPUT. */
  taegBp: z.number().int(),
  /** TAN em pontos base. Usado em TAN_AND_FEES. */
  tanBp: z.number().int(),
  /** Prazos permitidos em meses, ex.: [24,36,48,60,72,84,96] */
  allowedTerms: z.array(z.number().int()),
  defaultTermMonths: z.number().int(),
  defaultDownPaymentPct: z.number().int(),
  maxDownPaymentPct: z.number().int(),
  /** Montante mínimo financiado em cêntimos */
  minFinancedCents: z.number().int(),
  /** Montante máximo financiado em cêntimos */
  maxFinancedCents: z.number().int(),
  /** Comissão de abertura em cêntimos */
  openingFeeCents: z.number().int(),
  /** Encargo mensal fixo em cêntimos */
  monthlyFeeCents: z.number().int(),
  /** Imposto do selo em pontos base */
  stampDutyRateBp: z.number().int(),
  maxVehicleAgeAtEndYears: z.number().int().nullable(),
  /** Percentagem acima do orçamento para "ficam perto" */
  budgetNearPct: z.number().int(),
  representativeExampleTemplate: z.string().nullable(),
  legalNote: z.string().nullable(),
  validFrom: z.string().datetime().nullable(),
  validTo: z.string().datetime().nullable(),
});
export type FinancingProduct = z.infer<typeof FinancingProductSchema>;

// ── Resultado de simulação ─────────────────────────────────────────────────

export const FinancingResultSchema = z.object({
  /** Montante financiado em cêntimos */
  principalCents: z.number().int(),
  /** Prestação mensal em cêntimos (arredondada ao cêntimo) */
  monthlyPaymentCents: z.number().int(),
  /** MTIC em cêntimos */
  mticCents: z.number().int(),
  /** Total de juros em cêntimos */
  interestCents: z.number().int(),
  /** TAN implícita em pontos base (só em TAEG_INPUT; TAN = i×12) */
  impliedTanBp: z.number().int().nullable(),
  /** TAEG em pontos base */
  taegBp: z.number().int(),
  /** Entrada em cêntimos */
  entryCents: z.number().int(),
  /** Prazo em meses */
  termMonths: z.number().int(),
});
export type FinancingResult = z.infer<typeof FinancingResultSchema>;

// ── Pedido de simulação ────────────────────────────────────────────────────

export const SimulationRequestSchema = z.object({
  priceCents: z.number().int().positive(),
  entryCents: z.number().int().min(0),
  termMonths: z.number().int().positive(),
  financingProductId: z.string().uuid().optional(),
});
export type SimulationRequest = z.infer<typeof SimulationRequestSchema>;
