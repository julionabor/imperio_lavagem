/**
 * Mailer — nodemailer via SMTP (Brevo) ou log de consola em desenvolvimento.
 * Configurado por EMAIL_TRANSPORT:
 *   "console"         → escreve no log (dev)
 *   URL SMTP completa → usa nodemailer (prod)
 */
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../config.ts';

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;
  if (config.EMAIL_TRANSPORT === 'console') {
    // Transporte de desenvolvimento — não envia nada, escreve no log
    _transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    return _transporter;
  }
  _transporter = nodemailer.createTransport(config.EMAIL_TRANSPORT);
  return _transporter;
}

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(options: MailOptions): Promise<void> {
  const transporter = getTransporter();

  if (config.EMAIL_TRANSPORT === 'console') {
    console.log(
      `[mailer] Para: ${options.to} | Assunto: ${options.subject}\n${options.text}`,
    );
    return;
  }

  await transporter.sendMail({
    from: config.EMAIL_FROM,
    ...options,
  });
}

/** Email de notificação de novo lead para o stand. */
export async function sendNewLeadNotification(opts: {
  leadId: string;
  name: string;
  phone: string;
  email?: string;
  type: string;
  vehicleTitle?: string;
  standEmail: string;
}): Promise<void> {
  const subject = `Novo pedido de ${opts.name} — ${opts.type}`;
  const text = [
    `Novo lead recebido:`,
    `Nome: ${opts.name}`,
    `Telefone: ${opts.phone}`,
    opts.email ? `Email: ${opts.email}` : '',
    opts.vehicleTitle ? `Viatura: ${opts.vehicleTitle}` : '',
    `Tipo: ${opts.type}`,
    ``,
    `Ver no CRM: /admin/leads/${opts.leadId}`,
  ]
    .filter(Boolean)
    .join('\n');

  await sendMail({ to: opts.standEmail, subject, text });
}

/** Email de confirmação para o cliente. */
export async function sendLeadConfirmation(opts: {
  name: string;
  email: string;
  type: string;
}): Promise<void> {
  const firstName = opts.name.split(' ')[0];
  await sendMail({
    to: opts.email,
    subject: 'Pedido recebido — Private Motors',
    text: `Olá ${firstName},\n\nRecebemos o seu pedido e entraremos em contacto brevemente.\n\nEquipa Private Motors`,
  });
}
