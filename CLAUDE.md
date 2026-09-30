# Private Motors — instruções para o Claude Code

Site de stand automóvel (Portugal) com pesquisa inteligente, simulador de financiamento, backoffice que gere todo o conteúdo, CRM de leads e API Node. Este ficheiro contém as regras permanentes; o "quê" está na spec.

## Fontes de verdade (ler antes de implementar)

| Ficheiro | Para quê |
| --- | --- |
| `docs/SPEC.md` | Especificação funcional e técnica completa. Em caso de dúvida, a spec manda. |
| `docs/FASES.md` | Ordem de implementação e critério de saída de cada fase. |
| `docs/design/Private_Motors.html` | Protótipo visual do Claude Design (abrir no browser). Referência de layout, espaçamentos e estados. |
| `docs/design/prototype-logic.js` | Lógica original do protótipo: seed `CARS`, `parse()`, `pay()`/`fin()`, `recommend()`, sugestões do estado vazio, textos e tokens. Portar a lógica, não copiar o estilo React/inline. |
| `docs/PROGRESS.md` | Estado de cada fase e decisões tomadas durante a implementação (criar se não existir e manter atualizado). |

Antes de cada tarefa, lê as secções da spec relevantes (indicadas em `docs/FASES.md`). Se a spec for omissa ou contraditória, pergunta antes de inventar. Nunca inventes valores de negócio (taxas, prazos, textos legais, contactos): usa os da spec ou do protótipo e marca-os como provisórios.

## Stack fixada

- Monorepo **Nx 21.x** com **pnpm 10.x**
- **Angular 22.x**: standalone, signals, zoneless, `@angular/ssr` no site; SPA sem SSR no admin
- **NgRx SignalStore** (`@ngrx/signals`)
- **Tailwind CSS 4.x** com tokens em `@theme`
- **Node 24 LTS** + **Fastify 5.x** + TypeScript estrito
- **Zod 4.x** (contratos partilhados), **Prisma 6.x** + **PostgreSQL 17**
- Imagens: Cloudflare R2 (MinIO em dev) + `sharp`; email: Brevo (Mailpit em dev); anti-spam: Cloudflare Turnstile
- Testes: **Vitest** + Angular Testing Library, **Playwright**, Supertest + Testcontainers
- Ícones Phosphor; fontes Archivo e Geist servidas localmente

Usa o último patch de cada major e fixa-o no lockfile. Não adiciones dependências fora desta lista sem justificar em `docs/PROGRESS.md`.

## Estrutura

```
apps/web  apps/admin  apps/api
libs/contracts  libs/finance  libs/search-parser  libs/assistant
libs/shared/ui  libs/shared/util
libs/web/data-access  libs/web/feature-*
libs/admin/data-access  libs/admin/feature-*
prisma/  docs/
```

Tags Nx obrigatórias (`scope:web|admin|api|shared`, `type:feature|ui|data-access|util`) e `@nx/enforce-module-boundaries` ativo. Dependências só num sentido: `feature → data-access → contracts` e `feature → ui`. `ui` nunca chama HTTP; `data-access` nunca renderiza.

## Comandos

```bash
pnpm install
docker compose up -d                 # postgres, minio, mailpit
pnpm nx run api:prisma-migrate       # ou: pnpm prisma migrate dev
pnpm nx run api:seed
pnpm nx serve api | web | admin
pnpm nx affected -t lint test typecheck build
pnpm nx e2e web-e2e
```

Ajusta esta secção se os nomes de targets mudarem. Antes de dar uma tarefa por concluída: `lint`, `typecheck` e `test` dos projetos afetados sem erros.

## Regras de código

### Geral
- TypeScript `strict`, sem `any` (usa `unknown` + validação Zod).
- Dinheiro sempre em **cêntimos (int)**; taxas em **pontos base (int)**. Formatação só na camada de apresentação (`libs/shared/util`, pt-PT, espaço fino antes de €).
- Enums e tipos vêm de `libs/contracts`. Nunca redefinir um DTO no front ou na API.
- **Nada de conteúdo hardcoded** no site: textos, vantagens, testemunhos, atalhos, contactos, horários e parâmetros de financiamento vêm da API. Exceção: labels de UI genéricos (ex.: "Limpar tudo") em constantes PT-PT.
- Textos visíveis em **português de Portugal**; código, nomes de ficheiros e identificadores em inglês.

### Financiamento
- Toda a matemática passa por `libs/finance` (pura, sem Angular). Front (`FinanceService`) e API usam a mesma função.
- Suporta `TAEG_INPUT` (protótipo: TAEG 15 %, sem entrada, 96 meses) e `TAN_AND_FEES`. Ver `docs/SPEC.md` §4.3.
- Testes obrigatórios contra os valores do protótipo (`pay()`/`fin()` em `prototype-logic.js`).

### Angular
- Componentes standalone, `ChangeDetectionStrategy.OnPush`, `inject()`, `input()`/`output()`/`model()`, control flow `@if/@for(track)/@defer`. Sem `NgModule`, sem `*ngIf`/`*ngFor`.
- Componentes de apresentação sem serviços injetados. Estado em SignalStores (§7.3 da spec); filtros sincronizados com o URL num único sítio (`SearchStore`).
- Prefixo de seletores `pm-`. Nomes de componentes conforme §8.2 da spec.
- Interceptors e guards funcionais. Formulários reativos tipados.
- `NgOptimizedImage` para imagens; `@defer` para galeria, mapa e secções abaixo da dobra.

### Estilos
- Só classes Tailwind sobre os tokens de `libs/shared/ui/styles/theme.css` (§8.1 da spec). **Proibido** valores arbitrários (`bg-[#...]`, `p-[13px]`) e cores/sombras inline.
- Mobile-first; área de toque mínima 44 px (`min-h-touch`); foco visível; contraste AA.
- Implementar todos os estados do design (hover, focus, active, disabled, loading, skeleton, vazio, erro).
- Comportamentos acessíveis (overlays, foco, teclado) com Angular CDK; visual 100 % Tailwind.

### API
- Camadas por módulo: `routes → controller → service → repository` (+ `mapper`). Routes não tocam no Prisma; services não conhecem Fastify; repositories sem regras de negócio.
- Validação de entrada e saída com os schemas Zod; OpenAPI gerado em `/api/docs`.
- Erros em `application/problem+json` (RFC 9457). DTOs públicos nunca expõem campos internos.
- Escritas do admin registam `AuditLog` e invalidam a cache pública.
- `POST /public/leads` cria contacto + lead + atividade + tarefa numa só transação (§3.4 da spec).

### Segurança e RGPD
- Segredos só em variáveis de ambiente validadas no arranque; nunca no repositório.
- argon2id, JWT de 15 min, refresh em cookie `httpOnly; Secure; SameSite=Strict` com rotação.
- Rate limit, Turnstile e honeypot em todos os formulários públicos.
- Consentimentos guardados com data, texto e origem; exportações de marketing só com `consentMarketing`.
- Remover EXIF (incluindo GPS) de todas as imagens enviadas.

## Testes
- `libs/finance`, `libs/search-parser`, `libs/assistant`: cobertura ≥ 95 %. As frases de exemplo do design são casos de teste do parser.
- Services da API e stores: ≥ 80 %.
- Cada endpoint com teste de integração, incluindo permissões por perfil (ADMIN, EDITOR, SALES).
- E2E Playwright para os fluxos críticos listados em §9.1 da spec.

## Forma de trabalhar
1. Trabalha **uma fase de cada vez**, pela ordem de `docs/FASES.md`. Não avances sem cumprir o critério de saída.
2. Dentro da fase, faz passos pequenos e verificáveis; corre lint/typecheck/testes no fim de cada passo.
3. No fim de cada fase atualiza `docs/PROGRESS.md`: o que foi feito, decisões tomadas, desvios à spec e o que ficou pendente.
4. Se precisares de mudar algo da spec, propõe a alteração e explica porquê antes de a implementar.
5. Commits pequenos, mensagens em inglês no formato Conventional Commits (`feat(web): ...`, `fix(api): ...`).

## Não fazer
- Não usar PrimeNG, Angular Material ou outras bibliotecas de componentes visuais.
- Não usar `localStorage` para dados de negócio (só favoritos e preferências do visitante).
- Não chamar a API por cada movimento de slider do simulador.
- Não duplicar cálculos de financiamento fora de `libs/finance`.
- Não apagar nem reescrever migrações Prisma já aplicadas.
