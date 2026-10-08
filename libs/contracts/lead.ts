import { z } from 'zod';

// ── Enums ──────────────────────────────────────────────────────────────────

export const LeadType = z.enum([
  'QUOTE',
  'TEST_DRIVE',
  'CONTACT',
  'TRADE_IN',
  'FINANCING',
  'SOURCING',
]);
export type LeadType = z.infer<typeof LeadType>;

export const LeadSource = z.enum([
  'VEHICLE_PAGE',
  'HOME_SEARCH',
  'BUDGET_SEARCH',
  'EMPTY_STATE',
  'QUOTE_FORM',
  'CONTACT_PAGE',
  'WHATSAPP',
  'ASSISTANT',
]);
export type LeadSource = z.infer<typeof LeadSource>;

export const LeadStatus = z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST']);
export type LeadStatus = z.infer<typeof LeadStatus>;

export const ContactLifecycle = z.enum(['LEAD', 'PROSPECT', 'CUSTOMER', 'INACTIVE']);
export type ContactLifecycle = z.infer<typeof ContactLifecycle>;

export const ActivityType = z.enum([
  'CALL',
  'WHATSAPP',
  'EMAIL',
  'SMS',
  'VISIT',
  'TEST_DRIVE',
  'NOTE',
  'STAGE_CHANGE',
  'SYSTEM',
]);
export type ActivityType = z.infer<typeof ActivityType>;

export const ActivityDirection = z.enum(['IN', 'OUT']);
export type ActivityDirection = z.infer<typeof ActivityDirection>;

export const LostReason = z.enum([
  'PRICE',
  'FINANCING_REJECTED',
  'BOUGHT_ELSEWHERE',
  'NO_RESPONSE',
  'VEHICLE_SOLD',
  'OTHER',
]);
export type LostReason = z.infer<typeof LostReason>;

// ── Validação de telemóvel PT ─────────────────────────────────────────────

/** Telemóvel PT: 9[1236]XXXXXXX ou fixo 2XXXXXXXXX */
export const ptPhoneSchema = z
  .string()
  .regex(/^(9[1236]\d{7}|2\d{8})$/, 'Número de telefone inválido');

// ── CreateLeadDto (do site para a API) ────────────────────────────────────

export const CreateLeadSchema = z.object({
  type: LeadType,
  source: LeadSource,
  vehicleSlug: z.string().optional(),
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal('')),
  phone: ptPhoneSchema,
  preferredContact: z.enum(['PHONE', 'WHATSAPP', 'EMAIL']).optional(),
  preferredDate: z.string().datetime().optional(),
  message: z.string().max(2000).optional(),
  searchSnapshot: z.record(z.string(), z.unknown()).optional(),
  simulationSnapshot: z.record(z.string(), z.unknown()).optional(),
  assistantAnswers: z.record(z.string(), z.unknown()).optional(),
  /** Honeypot — ignorado se preenchido */
  website: z.string().optional(),
  consentPrivacy: z.literal(true),
  consentMarketing: z.boolean(),
  utm: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      term: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),
});
export type CreateLead = z.infer<typeof CreateLeadSchema>;

// ── TradeIn ────────────────────────────────────────────────────────────────

export const CreateTradeInSchema = z.object({
  brand: z.string().max(80),
  model: z.string().max(80),
  version: z.string().max(120).optional(),
  year: z.number().int().min(1960).max(new Date().getFullYear()),
  mileageKm: z.number().int().min(0),
  fuel: z.string().max(40).optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateTradeIn = z.infer<typeof CreateTradeInSchema>;

// ── Resposta pública ───────────────────────────────────────────────────────

export const LeadCreatedResponseSchema = z.object({
  leadId: z.string().uuid(),
  contactId: z.string().uuid(),
  message: z.string(),
});
export type LeadCreatedResponse = z.infer<typeof LeadCreatedResponseSchema>;

// ── AssistantRequest ──────────────────────────────────────────────────────

export const AssistantAnswersSchema = z.object({
  uso: z.string(),
  fam: z.string(),
  orc: z.string(),
  fuel: z.string(),
});
export type AssistantAnswers = z.infer<typeof AssistantAnswersSchema>;

export const AssistantRecommendResponseSchema = z.object({
  vehicleIds: z.array(z.string().uuid()),
  exact: z.boolean(),
});
export type AssistantRecommendResponse = z.infer<typeof AssistantRecommendResponseSchema>;
