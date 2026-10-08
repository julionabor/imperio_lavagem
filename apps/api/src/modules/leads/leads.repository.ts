import { prisma } from '../../shared/prisma-client.ts';
import type { LeadType, LeadSource, PreferredContact } from '@prisma/client';

/** Normaliza telemóvel para E.164 (prefix +351). */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('351')) return `+${digits}`;
  return `+351${digits}`;
}

/** Encontra contacto existente por telemóvel ou email. */
export async function findExistingContact(phone: string, email?: string) {
  const normalized = normalizePhone(phone);
  // Deduplicação: primeiro por telemóvel, depois por email
  const byPhone = await prisma.contact.findUnique({ where: { phone: normalized } });
  if (byPhone) return byPhone;
  if (email) {
    const byEmail = await prisma.contact.findFirst({ where: { email } });
    if (byEmail) return byEmail;
  }
  return null;
}

/** Procura o primeiro utilizador SALES ativo para atribuição por rotação. */
export async function getNextAssignee(currentAssigneeId?: string): Promise<string | null> {
  const salesUsers = await prisma.user.findMany({
    where: { role: 'SALES', active: true },
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  if (!salesUsers.length) return null;
  if (!currentAssigneeId) return salesUsers[0]!.id;
  const currentIdx = salesUsers.findIndex((u) => u.id === currentAssigneeId);
  return salesUsers[(currentIdx + 1) % salesUsers.length]!.id;
}

/** Próximas 2 horas úteis (seg-sex, 9h-18h). */
function nextBusinessHours(from: Date = new Date()): Date {
  const due = new Date(from.getTime() + 2 * 60 * 60 * 1000);
  // Se for fora do horário de trabalho, avança para as 9h do próximo dia útil
  const hour = due.getHours();
  const day = due.getDay(); // 0=Dom, 6=Sáb
  if (day === 0) due.setDate(due.getDate() + 1);
  if (day === 6) due.setDate(due.getDate() + 2);
  if (hour < 9) due.setHours(9, 0, 0, 0);
  if (hour >= 18) { due.setDate(due.getDate() + 1); due.setHours(9, 0, 0, 0); }
  return due;
}

/** Cria lead + contacto + atividade + tarefa numa transação. */
export async function createLeadTransaction(data: {
  type: LeadType;
  source: LeadSource;
  name: string;
  phone: string;
  email?: string;
  preferredContact?: PreferredContact;
  preferredDate?: Date;
  message?: string;
  vehicleId?: string;
  searchSnapshot?: object;
  simulationSnapshot?: object;
  assistantAnswers?: object;
  utm?: object;
  consentPrivacy: boolean;
  consentMarketing: boolean;
}): Promise<{ leadId: string; contactId: string }> {
  const normalizedPhone = normalizePhone(data.phone);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Upsert do contacto
    const existing = await tx.contact.findUnique({ where: { phone: normalizedPhone } });
    let contact;
    if (existing) {
      contact = await tx.contact.update({
        where: { id: existing.id },
        data: {
          lastInteractionAt: new Date(),
          ...(data.email && !existing.email ? { email: data.email } : {}),
          ...(data.consentMarketing && !existing.consentMarketing
            ? { consentMarketing: true, consentAt: new Date(), consentSource: 'website' }
            : {}),
        },
      });
    } else {
      contact = await tx.contact.create({
        data: {
          name: data.name,
          phone: normalizedPhone,
          email: data.email ?? null,
          preferredContact: data.preferredContact ?? null,
          lifecycle: 'LEAD',
          firstSource: data.source,
          lastInteractionAt: new Date(),
          consentPrivacy: data.consentPrivacy,
          consentMarketing: data.consentMarketing,
          consentAt: new Date(),
          consentSource: 'website',
        },
      });
    }

    // 2. Primeiro estágio do pipeline (OPEN)
    const firstStage = await tx.pipelineStage.findFirst({
      where: { kind: 'OPEN' },
      orderBy: { position: 'asc' },
    });

    // 3. Atribuição por rotação
    const lastLead = await tx.lead.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { assignedToId: true },
    });
    const assigneeId = await getNextAssignee(lastLead?.assignedToId ?? undefined);

    // 4. Criar o lead
    const lead = await tx.lead.create({
      data: {
        type: data.type,
        source: data.source,
        name: data.name,
        phone: normalizedPhone,
        email: data.email ?? null,
        preferredContact: data.preferredContact ?? null,
        preferredDate: data.preferredDate ?? null,
        message: data.message ?? null,
        vehicleId: data.vehicleId ?? null,
        contactId: contact.id,
        stageId: firstStage?.id ?? null,
        assignedToId: assigneeId,
        searchSnapshot: data.searchSnapshot ?? undefined,
        simulationSnapshot: data.simulationSnapshot ?? undefined,
        assistantAnswers: data.assistantAnswers ?? undefined,
        utm: data.utm ?? undefined,
        consentPrivacy: data.consentPrivacy,
        consentMarketing: data.consentMarketing,
        consentAt: new Date(),
      },
    });

    // 5. Regista atividade SYSTEM
    await tx.activity.create({
      data: {
        contactId: contact.id,
        leadId: lead.id,
        type: 'SYSTEM',
        direction: 'IN',
        summary: `Novo pedido recebido via website (${data.source})`,
        occurredAt: new Date(),
      },
    });

    // 6. Cria tarefa "Ligar ao cliente"
    if (assigneeId) {
      await tx.task.create({
        data: {
          contactId: contact.id,
          leadId: lead.id,
          title: `Ligar ao cliente — ${data.name}`,
          dueAt: nextBusinessHours(),
          assigneeId,
          status: 'OPEN',
        },
      });
    }

    return { leadId: lead.id, contactId: contact.id };
  });

  return result;
}
