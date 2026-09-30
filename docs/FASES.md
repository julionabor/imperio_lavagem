# Fases de implementação

Cada fase tem as secções da spec a ler, o âmbito, o critério de saída e um prompt pronto para o Claude Code. Não avançar para a fase seguinte sem cumprir o critério de saída e atualizar `docs/PROGRESS.md`.

---

## Fase 1 — Fundações

**Ler:** SPEC §1, §3, §4.3, §7.1, §8.1, §9.2 · `docs/design/prototype-logic.js`

**Âmbito**
- Workspace Nx com pnpm, apps `web`, `admin`, `api`, libs da §7.1 e tags de fronteira.
- `docker-compose.yml` (PostgreSQL 17, MinIO, Mailpit) e `.env.example`.
- `libs/shared/ui/styles/theme.css` com os tokens da §8.1; fontes e ícones locais.
- `libs/contracts` com os schemas Zod das entidades e filtros.
- `libs/finance`, `libs/search-parser` e `libs/assistant` portados do protótipo, puros e testados.
- `schema.prisma` completo (§3.1–3.4), primeira migração e seed (catálogo PT, 1 admin, produto de financiamento `TAEG_INPUT` 15 %, as 20 viaturas do protótipo, conteúdos da home do protótipo).
- CI no GitHub Actions: lint, typecheck, test, build afetados.

**Sai quando:** a prestação calculada bate ao cêntimo com `pay()`/`fin()` do protótipo; todas as frases de exemplo do design geram os chips esperados; `nx affected -t lint typecheck test build` passa.

**Prompt**
> Lê o `CLAUDE.md`, a `docs/SPEC.md` (§1, §3, §4.3, §7.1, §8.1, §9.2) e `docs/design/prototype-logic.js`. Implementa a Fase 1 descrita em `docs/FASES.md`. Começa por mostrar-me o plano de ficheiros e o `schema.prisma` antes de gerar o resto. Porta `pay`, `fin`, `parse` e `recommend` do protótipo para as libs puras, com testes que usem os valores do protótipo como referência.

---

## Fase 2 — API núcleo + autenticação

**Ler:** SPEC §3, §5.1, §6 (completa)

**Âmbito**
- Fastify com plugins (Prisma, auth, CORS, helmet, rate limit, swagger, multipart), config validada.
- Módulos: auth, vehicles, images (R2/MinIO + sharp), catalog, financing, featured, content, settings, users, audit.
- Endpoints públicos da §6.2, incluindo modo orçamento, facetas e `/vehicles/suggestions`.
- Endpoints admin da §6.3 exceto CRM, com permissões por perfil.
- Erros problem+json, cache pública com ETag e invalidação por tags.

**Sai quando:** todos os endpoints têm testes de integração (Supertest + Testcontainers), incluindo testes de permissões; OpenAPI disponível em `/api/docs`.

**Prompt**
> Implementa a Fase 2 de `docs/FASES.md` seguindo a §6 da `docs/SPEC.md` e as regras de API do `CLAUDE.md`. Faz um módulo de cada vez (começa por auth e vehicles), com testes de integração antes de passares ao seguinte.

---

## Fase 3 — Backoffice de stock

**Ler:** SPEC §5 (RF-A01 a RF-A07, RF-A10, RF-A13), §7.4, §7.5, §8.2

**Âmbito**
- App `admin`: login, recuperação de password, layout, dashboard.
- Viaturas: lista, formulário com separadores, autosave, publicação com validações, fotos (upload, ordenar, capa, alt).
- Catálogos (marcas, modelos, equipamento, badges, sinónimos), financiamento com simulador de teste.

**Sai quando:** é possível criar e publicar 10 viaturas reais com fotos sem tocar na base de dados; E2E de "criar e publicar viatura" a passar.

**Prompt**
> Implementa a Fase 3 de `docs/FASES.md`. Usa os tokens e componentes base de `libs/shared/ui`; o admin pode usar a variante clara descrita na §8.1. Mostra-me primeiro a estrutura de rotas e stores do admin.

---

## Fase 4 — Site público: homepage

**Ler:** SPEC §2 (completa), §4.1, §4.2 (RF-P01 a RF-P06, RF-P09, RF-P12 a RF-P14), §7.3, §8 · abrir `docs/design/Private_Motors.html` no browser

**Âmbito**
- Header, footer, SSR e SEO base.
- Pesquisa inteligente com chips "Entendi:", atalhos e frases de exemplo; modos carro e orçamento.
- Painel de 8 filtros (inline em lg+, bottom sheet em mobile), chips ativos, ordenação, "Mostrar mais".
- Card 1a com gaveta de simulação, variantes destaque e compacto; estado vazio com sugestões e "Pedimos o carro por si".
- Destaques, vantagens, testemunhos, bloco do assistente (só o CTA nesta fase), favoritos.

**Sai quando:** o comportamento é igual ao protótipo em mobile e desktop (comparar lado a lado); qualquer pesquisa é reproduzível pelo URL; Lighthouse mobile ≥ 90.

**Prompt**
> Implementa a Fase 4 de `docs/FASES.md`. Abre `docs/design/Private_Motors.html` como referência visual e replica layout, espaçamentos, estados e microinterações com Tailwind e os tokens do `theme.css`, sem valores arbitrários. A lógica vem das libs da Fase 1. Começa pelo `pm-vehicle-card` com `pm-finance-inline`, depois `pm-smart-search`, e só depois a página.

---

## Fase 5 — Site público: restantes páginas

**Ler:** SPEC §4.1, §4.2 (RF-P07, RF-P08, RF-P10, RF-P11), §2.2

**Âmbito**
- Detalhe da viatura com galeria, especificações, equipamento, simulador 2a (preparado para 2b), CTAs, semelhantes, `schema.org/Car`.
- Retoma, orçamento, sobre, contactos, páginas legais, 404.

**Sai quando:** o cliente aprova a revisão visual. Se a 2.ª ronda do design ainda não existir, seguir os tokens e padrões da homepage e marcar em `docs/PROGRESS.md` o que terá de ser ajustado.

**Prompt**
> Implementa a Fase 5 de `docs/FASES.md`. Estas páginas ainda não têm layout no design: usa os mesmos tokens, componentes e padrões da homepage e do simulador 2a do protótipo. Regista em `docs/PROGRESS.md` as decisões visuais que tomares.

---

## Fase 6 — Leads, CRM, conteúdo e assistente

**Ler:** SPEC §3.4, §4.2 (RF-P15), §5 (RF-A06, RF-A08, RF-A09, RF-A11, RF-A12, RF-A14, RF-A15), §6.3 (CRM)

**Âmbito**
- `POST /public/leads` transacional (contacto, lead, atividade, tarefa), emails, atribuição por rotação, alertas.
- CRM no admin: pipeline kanban, contactos com ficha e linha do tempo, tarefas, relatórios, importação/exportação CSV, anonimização.
- Destaques, editores de conteúdo, definições, utilizadores e auditoria.
- Assistente guiado no site (`pm-assistant`) e o seu editor no admin.

**Sai quando:** nenhum texto ou imagem do site está no código; um lead enviado do site aparece no CRM ligado ao contacto certo, sem duplicados, com tarefa atribuída e email enviado.

**Prompt**
> Implementa a Fase 6 de `docs/FASES.md`. Começa pelo fluxo `POST /public/leads` com deduplicação de contactos e testes, depois o CRM no admin, depois conteúdos e por fim o assistente.

---

## Fase 7 — Qualidade e lançamento

**Ler:** SPEC §9, §10 (critérios de aceitação globais)

**Âmbito:** E2E completos (§9.1), axe sem erros críticos, SEO (sitemap, robots, dados estruturados), banner de cookies, Sentry, backups, Dockerfiles e deploy Coolify, documentação de operação para o stand.

**Sai quando:** todos os critérios de aceitação globais da §10 estão cumpridos.

**Prompt**
> Implementa a Fase 7 de `docs/FASES.md`. Faz primeiro uma auditoria contra os critérios de aceitação da §10 da spec e apresenta-me a lista do que falta antes de corrigir.

---

## Fase 8 — Opcional (pós-lançamento)

Assistente com IA (substitui o parser e o motor de regras sem mudar os contratos), comparador de viaturas e integração com o Standvirtual (`externalRef`). Planear com a spec atualizada antes de começar.
