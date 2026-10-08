import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter pelo menos 32 caracteres'),
  UPLOAD_DIR: z.string().default('uploads'),
  /** URL do site Angular (para CORS) */
  WEB_URL: z.string().url().default('http://localhost:4200'),
  /** nodemailer SMTP URL ou "console" para log local */
  EMAIL_TRANSPORT: z.string().default('console'),
  EMAIL_FROM: z.string().default('"Private Motors" <noreply@privatemotors.pt>'),
});

function loadConfig() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Configuração inválida:\n${errors}`);
  }
  return result.data;
}

export const config = loadConfig();
export type Config = typeof config;
