/** Extensões de tipos do Fastify para a API da Private Motors. */
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '@prisma/client';

export interface JwtPayload {
  id: string;
  role: UserRole;
  name: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    /** Prehandler que valida o JWT e popula request.user. */
    authenticate: (req: FastifyRequest, rep: FastifyReply) => Promise<void>;
    /** Prehandler que popula request.user se o JWT existir (não bloqueia). */
    authenticateOptional: (req: FastifyRequest, rep: FastifyReply) => Promise<void>;
  }
}
