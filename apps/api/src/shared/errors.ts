/**
 * Problem+JSON (RFC 9457) — helpers para erros da API.
 * Todos os erros da API são devolvidos como application/problem+json.
 */
import type { FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export interface ProblemJson {
  type: string;
  title: string;
  status: number;
  detail?: string;
  errors?: Array<{ field: string; message: string }>;
}

const BASE_TYPE = 'https://privatemotors.pt/errors/';

export function problem(
  reply: FastifyReply,
  status: number,
  title: string,
  detail?: string,
  errors?: ProblemJson['errors'],
): void {
  const slug = title.toLowerCase().replace(/\s+/g, '-');
  reply
    .status(status)
    .header('content-type', 'application/problem+json')
    .send({ type: `${BASE_TYPE}${slug}`, title, status, detail, errors });
}

export function problemFromZod(reply: FastifyReply, error: ZodError): void {
  const errors = error.issues.map((i) => ({
    field: i.path.join('.'),
    message: i.message,
  }));
  problem(reply, 400, 'Validação inválida', 'Um ou mais campos são inválidos.', errors);
}

export function notFound(reply: FastifyReply, detail?: string): void {
  problem(reply, 404, 'Não encontrado', detail ?? 'O recurso pedido não existe.');
}

export function forbidden(reply: FastifyReply, detail?: string): void {
  problem(reply, 403, 'Sem permissão', detail ?? 'Não tem permissão para esta operação.');
}

export function unauthorized(reply: FastifyReply, detail?: string): void {
  problem(reply, 401, 'Não autenticado', detail ?? 'Autenticação necessária.');
}

export function conflict(reply: FastifyReply, detail?: string): void {
  problem(reply, 409, 'Conflito', detail ?? 'O recurso já existe ou está em conflito.');
}

export function unprocessable(reply: FastifyReply, detail?: string): void {
  problem(reply, 422, 'Regra de negócio', detail ?? 'A operação não pode ser processada.');
}

export function gone(reply: FastifyReply, detail?: string): void {
  problem(reply, 410, 'Viatura vendida', detail ?? 'Esta viatura já foi vendida.');
}
