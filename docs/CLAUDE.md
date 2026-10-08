# Private Motors — instruções para o Claude Code

Site de stand automóvel (Portugal) com pesquisa inteligente, simulador de financiamento, backoffice que gere todo o conteúdo, CRM de leads e API Node. Este ficheiro contém as regras permanentes; o "quê" está na spec.

**Princípio do projeto: o mínimo de ferramentas possível.** Antes de acrescentar uma dependência, pergunta-te se dá para fazer com o Angular, o Node ou o que já está na lista abaixo. Se não der, justifica em `docs/PROGRESS.md` antes de instalar.

## Fontes de verdade (ler antes de implementar)

| Ficheiro | Para quê |
| --- | --- |
| `docs/SPEC.md` | Especificação funcional e técnica completa. Em caso de dúvida, a spec manda. |
| `docs/FASES.md` | Ordem de implementação e critério de saída de cada fase. |
| `docs/PROGRESS.md` | Estado das fases, decisões e checklist de testes manuais. Mantém-no atualizado. |
| `docs/design/prototype-logic.js` | Lógica do protótipo: seed `CARS`, `parse()`, `pay()`/`fin()`, `recommend()`, sugestões do estado vazio, textos e tokens. Porta a lógica; não copies o estilo React/inline. |
| `docs/design/Private_Motors.html` | Protótipo visual (bundle de 5 MB). **Não o leias como texto**: é para abrir no browser. Se precisares de o ver, pede-me capturas de ecrã. |

Antes de cada tarefa, lê as secções da spec indicadas em `docs/FASES.md`. Se a spec for omissa ou contraditória, pergunta antes de inventar. Nunca inventes valores de negócio (taxas, prazos, textos legais, contactos): usa os da spec ou do protótipo e marca-os como provisórios.

## Stack (e só esta)

- **pnpm 10** com workspaces. Sem Nx, Turborepo, Lerna ou similares.
- **Angular 22** (Angular CLI), standalone, signals, zoneless, `@angular/ssr`. Uma só app: site com SSR + admin em `/admin` com `RenderMode.Client`.
- **@ngrx/signals** (SignalStore) e **@angular/cdk** (overlay, a11y, drag-drop).
- **Tailwind CSS 4** com tokens em `apps/web/src/styles/theme.css`.
- **Node 24 LTS** + **Fastify 5** com `@fastify/jwt`, `@fastify/cookie`, `@fastify/cors`, `@fastify/helmet`, `@fastify/multipart`, `@fastify/rate-limit`, `@fastify/static`, `@fastify/swagger`, `@fastify/swagger-ui`.
- **Zod 4** (contratos partilhados), **Prisma 6** + **PostgreSQL 17**.
- **sharp** (imagens), **nodemailer** (email via SMTP da Brevo), **marked** (Markdown das páginas legais e textos longos).
- **Vitest** para todos os testes (+ `@testing-library/angular` e jsdom no front). Em dev na API: **tsx**.
- Passwords com `crypto.scrypt` nativo; IDs com `crypto.randomUUID()`; datas com `Intl` nativo.

**Não usar:** Nx, Storybook, Playwright, Cypress, Testcontainers, Supertest, Sentry, Express, NestJS, Angular Material, PrimeNG, bibliotecas de gráficos, editores de texto rico, Leaflet, lodash, moment/date-fns, axios, captcha. Mapas com `<iframe>`; gráficos simples com HTML/SVG e Tailwind.

## Estrutura

```
pnpm-workspace.yaml        # packages: ["apps/*", "libs"]
docker-compose.yml         # só PostgreSQL (bases pm_dev e pm_test)
.env.example
apps/web/                  # Angular: site (SSR) + admin (/admin, só browser)
  src/styles/theme.css
  src/app/core/            # interceptors, guards, layouts, SEO, FinanceService
  src/app/shared/ui/       # componentes base pm-*
  src/app/shared/util/     # formatação €, km, pipes
  src/app/features/<nome>/{data-access,ui,pages}/
  src/app/admin/<módulo>/
apps/api/                  # Fastify: src/{main.ts,config.ts,plugins/,modules/<nome>/,shared/}, prisma/
libs/                      # pacote @pm/libs (TypeScript puro)
  contracts/ finance/ search-parser/ assistant/
docs/
```

**Regras de dependência (por convenção, não há ferramenta a verificar — respeita-as):**
- `libs/` não importa Angular, Node, Fastify nem Prisma. Só TypeScript e Zod.
- `shared/ui` não importa de `features/` nem de `admin/`. Componentes de UI nunca chamam HTTP.
- Uma feature não importa de outra; o que for comum sobe para `shared/` ou `core/`.
- O site nunca importa de `admin/`.
- Na API: `routes → service → repository`. Routes não tocam no Prisma; services não conhecem Fastify; repositories sem regras de negócio.

## Comandos

```bash
pnpm install
docker compose up -d
pnpm --filter api prisma migrate dev
pnpm --filter api seed
pnpm --filter api dev            # http://localhost:3000  (docs em /api/docs)
pnpm --filter web start          # http://localhost:4200
pnpm -r lint && pnpm -r typecheck && pnpm -r test
```

Cada pacote tem os scripts `dev`/`start`, `build`, `lint`, `typecheck` e `test`. Antes de dares uma tarefa por concluída, `lint`, `typecheck` e `test` têm de passar em todo o repositório.

## Regras de código

### Geral
- TypeScript `strict`, sem `any` (usa `unknown` + Zod).
- Dinheiro em **cêntimos (int)**, taxas em **pontos base (int)**. Formatação só na apresentação (pt-PT).
- Tipos e enums vêm de `@pm/libs/contracts`. Nunca redefinir um DTO.
- **Nada de conteúdo hardcoded no site**: textos, vantagens, testemunhos, atalhos, contactos, horários e financiamento vêm da API. Exceção: labels genéricos de UI.
- Textos visíveis em português de Portugal; código e identificadores em inglês.
- Configuração só por variáveis de ambiente, validadas com Zod no arranque e listadas no `.env.example`.

### Financiamento
- Toda a matemática em `@pm/libs/finance`, usada pelo front (`FinanceService`) e pela API.
- Modos `TAEG_INPUT` (protótipo: TAEG 15 %, sem entrada, 96 meses) e `TAN_AND_FEES` (SPEC §4.3).
- Testes contra `pay()`/`fin()` do protótipo, ao cêntimo.

### Angular
- Standalone, `OnPush`, `inject()`, `input()`/`output()`/`model()`, `@if/@for(track)/@defer`. Sem `NgModule`, `*ngIf`, `*ngFor`.
- Estado em SignalStores (SPEC §7.3). Filtros sincronizados com o URL só no `SearchStore`.
- Prefixo `pm-`; nomes conforme SPEC §8.2.
- Rotas `/admin/**` com `RenderMode.Client` em `app.routes.server.ts`; restantes com SSR.
- `NgOptimizedImage`; `@defer` para galeria, mapa e secções abaixo da dobra.

### Estilos
- Só classes Tailwind sobre os tokens do `theme.css` (SPEC §8.1). Proibido `bg-[#...]`, `p-[13px]` e estilos inline.
- Mobile-first, `min-h-touch` (44 px), foco visível, contraste AA, todos os estados do design.

### API
- Validação de entrada e saída com Zod; OpenAPI em `/api/docs`; erros em `application/problem+json`.
- Imagens através da interface `Storage` (implementação em disco, pasta `UPLOAD_DIR`), servidas em `/uploads` com cache longa e nome com hash. Remover EXIF.
- Emails através de `Mailer`; com `EMAIL_TRANSPORT=console` escreve no log.
- Escritas do admin registam `AuditLog`. Respostas públicas com `Cache-Control: public, max-age=60`.
- `POST /public/leads` cria contacto + lead + atividade + tarefa numa transação (SPEC §3.4).
- O arranque em produção corre `prisma migrate deploy` antes de iniciar o servidor.

### Segurança e RGPD
- Segredos nunca no Git. JWT de 15 min; refresh em cookie `httpOnly; Secure; SameSite=Strict` com rotação.
- Rate limit e campo honeypot em todos os formulários públicos.
- Consentimentos com data, texto e origem; exportações de marketing só com `consentMarketing`.

## Testes
- Vitest em todos os pacotes (`pnpm -r test`).
- `libs/`: cobertura ≥ 95 %; as frases de exemplo do design são casos de teste do parser.
- API: um ficheiro de teste por módulo com `app.inject()` contra a base `pm_test` (limpa antes de cada ficheiro), incluindo permissões por perfil.
- Front: stores e componentes com Testing Library.
- Fluxos de ponta a ponta: checklist manual em `docs/PROGRESS.md`, preenchida no fim de cada fase.

## Deploy (Railway)
- Serviço `api`: build `pnpm --filter api build`; start `pnpm --filter api start` (faz `prisma migrate deploy` e arranca); volume em `/data/uploads` (`UPLOAD_DIR`).
- Serviço `web`: build `pnpm --filter web build`; start `node apps/web/dist/web/server/server.mjs`.
- PostgreSQL gerido pelo Railway. Deploy automático a cada push para `main`, depois do CI.
- Não criar Dockerfiles nem ficheiros de infraestrutura além do necessário para o Railway; se precisares de configuração, usa `railway.json` por serviço.

## Forma de trabalhar
1. Uma fase de cada vez, pela ordem de `docs/FASES.md`. Não avançar sem cumprir o critério de saída.
2. Passos pequenos; `lint`, `typecheck` e `test` no fim de cada passo.
3. No fim de cada fase, atualizar `docs/PROGRESS.md` (feito, decisões, desvios, pendentes, checklist manual).
4. Mudanças à spec: propor e explicar antes de implementar.
5. Commits pequenos em Conventional Commits (`feat(web): ...`, `fix(api): ...`).
