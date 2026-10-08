import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import * as repo from './financing.repository.ts';
import { notFound, forbidden, unprocessable, problemFromZod } from '../../shared/errors.ts';
import { calcFinancingTaeg, calcFinancingTan } from '@pm/libs/finance';

export async function financingRoutes(app: FastifyInstance): Promise<void> {
  // GET /admin/financing-products
  app.get('/admin/financing-products', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await repo.listProducts());
  });

  // GET /admin/financing-products/:id
  app.get('/admin/financing-products/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    const { id } = req.params as { id: string };
    const p = await repo.findProductById(id);
    if (!p) return notFound(rep);
    return rep.send(p);
  });

  // POST /admin/financing-products
  app.post('/admin/financing-products', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role !== 'ADMIN') return forbidden(rep);
    const schema = z.object({
      name: z.string().min(1),
      lenderName: z.string().min(1),
      rateMode: z.enum(['TAEG_INPUT', 'TAN_AND_FEES']),
      taegBp: z.number().int().default(1500),
      tanBp: z.number().int().default(0),
      allowedTerms: z.array(z.number().int()).default([24, 36, 48, 60, 72, 84, 96]),
      defaultTermMonths: z.number().int().default(96),
      defaultDownPaymentPct: z.number().int().default(0),
      maxDownPaymentPct: z.number().int().default(50),
      minFinancedCents: z.number().int().default(0),
      maxFinancedCents: z.number().int().default(0),
      openingFeeCents: z.number().int().default(0),
      monthlyFeeCents: z.number().int().default(0),
      stampDutyRateBp: z.number().int().default(0),
      maxVehicleAgeAtEndYears: z.number().int().optional(),
      budgetNearPct: z.number().int().default(15),
      representativeExampleTemplate: z.string().optional(),
      legalNote: z.string().optional(),
      validFrom: z.string().datetime().optional(),
      validTo: z.string().datetime().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);
    const product = await repo.createProduct({
      ...parsed.data,
      isDefault: false,
      active: true,
      validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : null,
      validTo: parsed.data.validTo ? new Date(parsed.data.validTo) : null,
      representativeExampleTemplate: parsed.data.representativeExampleTemplate ?? null,
      legalNote: parsed.data.legalNote ?? null,
      maxVehicleAgeAtEndYears: parsed.data.maxVehicleAgeAtEndYears ?? null,
    });
    return rep.status(201).send(product);
  });

  // PATCH /admin/financing-products/:id
  app.patch('/admin/financing-products/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role !== 'ADMIN') return forbidden(rep);
    const { id } = req.params as { id: string };
    const p = await repo.findProductById(id);
    if (!p) return notFound(rep);
    const updated = await repo.updateProduct(id, req.body as never);
    return rep.send(updated);
  });

  // POST /admin/financing-products/:id/default
  app.post('/admin/financing-products/:id/default', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role !== 'ADMIN') return forbidden(rep);
    const { id } = req.params as { id: string };
    const p = await repo.findProductById(id);
    if (!p) return notFound(rep);
    if (!p.active) return unprocessable(rep, 'Não pode definir produto inativo como padrão.');
    await repo.setDefaultProduct(id);
    return rep.status(204).send();
  });

  // POST /admin/financing-products/simulate  (ou /admin/financing-products/:id/simulate)
  app.post('/admin/financing-products/simulate', { preValidation: [app.authenticate] }, async (req, rep) => {
    const schema = z.object({
      priceCents: z.number().int().positive(),
      entryCents: z.number().int().min(0).default(0),
      termMonths: z.number().int().positive(),
      financingProductId: z.string().uuid().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    let product = parsed.data.financingProductId
      ? await repo.findProductById(parsed.data.financingProductId)
      : await repo.findDefaultProduct();

    if (!product) return notFound(rep, 'Produto de financiamento não encontrado.');

    const result =
      product.rateMode === 'TAEG_INPUT'
        ? calcFinancingTaeg(parsed.data.priceCents, parsed.data.entryCents, parsed.data.termMonths, product.taegBp)
        : calcFinancingTan(parsed.data.priceCents, parsed.data.entryCents, parsed.data.termMonths, product.tanBp);

    return rep.send({
      monthlyPaymentCents: Math.round(result.monthlyPaymentCents),
      mticCents: Math.round(result.mticCents),
      interestCents: Math.round(result.interestCents),
      principalCents: result.principalCents,
      taegBp: product.taegBp,
      tanBp: product.rateMode === 'TAN_AND_FEES' ? product.tanBp : null,
    });
  });
}
