# Fases de implementação

Cada fase indica as secções da spec a ler, o âmbito, o critério de saída e um prompt pronto para o Claude Code. Comece cada fase numa conversa nova do Claude Code. Não avance sem cumprir o critério de saída e atualizar `docs/PROGRESS.md`.

---

## Fase 1 — Fundações

**Ler:** SPEC §1, §3, §4.3, §7.1, §8.1, §9.2 · `docs/design/prototype-logic.js`

**Âmbito**
- `pnpm-workspace.yaml`, `package.json` da raiz (só scripts e devDependencies comuns: TypeScript, Vitest, ESLint, Prettier).
- `apps/web`: app Angular criada com o CLI (`ng new` com SSR), Tailwind 4, `theme.css` com os tokens da §8.1, fontes e ícones locais.
- `apps/api`: Fastify mínimo com `config.ts` validado por Zod e `/health`.
- `libs/` (pacote `@pm/libs`): `contracts`, `finance`, `search-parser` e `assistant` portados do protótipo, puros e testados.
- `docker-compose.yml` só com PostgreSQL (bases `pm_dev` e `pm_test`), `.env.example`.
- `schema.prisma` completo (§3.1–3.4), primeira migração e seed (catálogo PT, 1 admin, produto `TAEG_INPUT` 15 %, as 20 viaturas do protótipo, conteúdos da home do protótipo).
- `.github/workflows/ci.yml`: install, lint, typecheck, test (com serviço PostgreSQL).

**Sai quando:** a prestação bate ao cêntimo com `pay()`/`fin()` do protótipo; todas as frases de exemplo geram os chips esperados; `pnpm -r lint typecheck test` passa localmente e no GitHub.

**Prompt**
> Lê o `CLAUDE.md` e a `docs/SPEC.md` (§1, §3, §4.3, §7.1, §8.1, §9.2) e `docs/design/prototype-logic.js`. Implementa a Fase 1 de `docs/FASES.md`. Mostra-me primeiro a árvore de ficheiros e o `schema.prisma`, e espera pela minha aprovação. Depois porta `pay`, `fin`, `parse` e `recommend` para `libs/`, com testes que usem os valores do protótipo como referência. Não instales nada fora da lista do `CLAUDE.md`.

---

## Fase 2 — Primeiro deploy

**Ler:** SPEC §9.2 · secção "Deploy" do `CLAUDE.md`

**Âmbito**
- `api` com `/health` e ligação à base; `web` com uma página "em construção" usando os tokens.
- Scripts `build` e `start` prontos para o Railway; `railway.json` por serviço se necessário.
- Guia curto em `docs/DEPLOY.md`: criar o projeto no Railway, ligar o GitHub, criar os dois serviços e o PostgreSQL, definir variáveis, montar o volume, ativar "Wait for CI".

**Sai quando:** um push para `main` fica online sozinho em `web` e `api`, e `/health` responde em produção.

**Prompt**
> Implementa a Fase 2 de `docs/FASES.md`. Prepara `apps/web` e `apps/api` para o Railway (scripts de build e start, migrações no arranque, `UPLOAD_DIR`) e escreve `docs/DEPLOY.md` com os passos que eu tenho de fazer no painel do Railway, um a um, para alguém com pouca experiência de deploy. Não crie Dockerfiles.

---

## Fase 3 — API núcleo + autenticação

**Ler:** SPEC §3, §5.1, §6

**Âmbito**
- Plugins (Prisma, auth, CORS, helmet, rate limit, multipart, static, swagger); erros problem+json.
- Módulos: auth, vehicles, images (Storage em disco + sharp), catalog, financing, featured, content, settings, users, audit, assistant.
- Endpoints públicos da §6.2 (incluindo modo orçamento, facetas e sugestões) e admin da §6.3 exceto CRM, com permissões por perfil.

**Sai quando:** cada módulo tem testes com `app.inject()` a passar, incluindo permissões; `/api/docs` mostra todos os endpoints.

**Prompt**
> Implementa a Fase 3 de `docs/FASES.md` seguindo a §6 da `docs/SPEC.md` e as regras de API do `CLAUDE.md`. Um módulo de cada vez, começando por auth e vehicles, com testes antes de passares ao seguinte.

---

## Fase 4 — Backoffice de stock

**Ler:** SPEC §5 (RF-A01 a RF-A07, RF-A10, RF-A13), §7.4, §7.5, §8.2

**Âmbito**
- Área `/admin` (lazy, `RenderMode.Client`): login, recuperação de password, layout, dashboard.
- Viaturas: lista, formulário com separadores, autosave, publicação com validações, fotos (upload, ordenar com CDK drag-drop, capa, alt).
- Catálogos e sinónimos, financiamento com simulador de teste.

**Sai quando:** consegue criar e publicar 10 viaturas reais com fotos sem tocar na base de dados.

**Prompt**
> Implementa a Fase 4 de `docs/FASES.md`. O admin vive em `apps/web/src/app/admin`, com rotas lazy e `RenderMode.Client`. Usa os componentes de `shared/ui` e os tokens do `theme.css`. Mostra-me primeiro as rotas e as stores do admin.

---

## Fase 5 — Site público: homepage

**Ler:** SPEC §2, §4.1, §4.2 (RF-P01 a RF-P06, RF-P09, RF-P12 a RF-P14), §7.3, §8

**Âmbito**
- Header, footer, SSR e SEO base.
- Pesquisa inteligente com chips "Entendi:", atalhos e frases de exemplo; modos carro e orçamento.
- Painel de 8 filtros (inline em lg+, bottom sheet em mobile), chips ativos, ordenação, "Mostrar mais".
- Card 1a com gaveta de simulação, variantes destaque e compacto; estado vazio com sugestões e "Pedimos o carro por si".
- Destaques, vantagens, testemunhos, CTA do assistente, favoritos.

**Sai quando:** o comportamento é igual ao protótipo em mobile e desktop (compare lado a lado no browser); qualquer pesquisa é reproduzível pelo URL; Lighthouse mobile ≥ 90.

**Prompt**
> Implementa a Fase 5 de `docs/FASES.md`. Vou enviar-te capturas do protótipo (`docs/design/Private_Motors.html`) em mobile e desktop como referência visual; replica layout, espaçamentos e estados com Tailwind e os tokens, sem valores arbitrários. A lógica vem de `@pm/libs`. Começa pelo `pm-vehicle-card` com `pm-finance-inline`, depois `pm-smart-search`, e só depois a página.

---

## Fase 6 — Site público: restantes páginas

**Ler:** SPEC §4.1, §4.2 (RF-P07, RF-P08, RF-P10, RF-P11), §2.2

**Âmbito:** detalhe da viatura (galeria, especificações, equipamento, simulador 2a, CTAs, semelhantes, `schema.org/Car`), retoma, orçamento, sobre, contactos, páginas legais, 404.

**Sai quando:** o cliente aprova a revisão visual.

**Prompt**
> Implementa a Fase 6 de `docs/FASES.md`. Estas páginas não têm layout no protótipo: segue os tokens, componentes e padrões da homepage e do simulador 2a. Regista em `docs/PROGRESS.md` as decisões visuais que tomares.

---

## Fase 7 — Leads, CRM, conteúdo e assistente

**Ler:** SPEC §3.4, §4.2 (RF-P15), §5 (RF-A06, RF-A08, RF-A09, RF-A11, RF-A12, RF-A14, RF-A15), §6.3

**Âmbito**
- `POST /public/leads` transacional com deduplicação de contactos, emails, atribuição por rotação, alertas.
- CRM no admin: pipeline (CDK drag-drop), contactos com ficha e linha do tempo, tarefas, relatórios simples em tabelas, exportação CSV, anonimização.
- Destaques, editores de conteúdo (Markdown com pré-visualização), definições, utilizadores, auditoria.
- Assistente guiado no site e o seu editor no admin.

**Sai quando:** nenhum texto ou imagem do site está no código; um lead enviado do site aparece no CRM ligado ao contacto certo, sem duplicados, com tarefa atribuída e email enviado.

**Prompt**
> Implementa a Fase 7 de `docs/FASES.md`. Começa pelo fluxo `POST /public/leads` com testes, depois o CRM no admin, depois conteúdos e por fim o assistente.

---

## Fase 8 — Lançamento

**Ler:** SPEC §9, §10

**Âmbito:** `sitemap.xml`, `robots.txt`, dados estruturados, banner de cookies e páginas legais, revisão de acessibilidade (axe DevTools + teclado), Lighthouse nas páginas principais, backups do Railway verificados (restauro testado), domínio definitivo, guia de utilização do admin para o stand em `docs/MANUAL-ADMIN.md`.

**Sai quando:** todos os critérios de aceitação da §10 estão marcados.

**Prompt**
> Faz uma auditoria do projeto contra os critérios de aceitação da §10 da `docs/SPEC.md` e apresenta-me a lista do que falta. Depois implementa a Fase 8 de `docs/FASES.md`.

---

## Depois do lançamento (opcional)

Assistente com IA, comparador de viaturas, integração com o Standvirtual e, se o volume o justificar, E2E automáticos, monitorização de erros e CDN de imagens. Atualizar a spec antes de começar.
