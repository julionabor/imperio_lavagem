# Private Motors — Especificação Funcional e Técnica

Sep 30, 2026 · @Julio Nabor

## 1. Visão geral

A Private Motors terá um site público de stand automóvel (Angular + Tailwind, com SSR para SEO), um backoffice que gere 100% do conteúdo visível no site e uma API REST em Node.js que serve ambos. Nada do que aparece no site é fixo no código: viaturas, destaques, parâmetros de financiamento, textos, vantagens, testemunhos, contactos e horários vêm todos da API.

### Âmbito do MVP

- Site público com as 6 páginas do design: Homepage, Listagem/pesquisa, Detalhe da viatura, "Quanto posso pagar?", Pedido de orçamento/retoma, Sobre + contactos.
- Pesquisa instantânea com filtros em chips, pesquisa por prestação mensal e simulador de financiamento (cards e detalhe).
- Backoffice completo: viaturas e fotos, destaques, financiamento, leads, conteúdos, catálogos, definições e utilizadores.
- API REST documentada (OpenAPI) com autenticação para a área de admin.

O assistente do design é guiado por regras (quatro perguntas em chips e pontuação do stock), por isso entra no MVP sem custos de IA. Fora do MVP (fase 2): assistente com linguagem natural por IA e integração com o Standvirtual; o modelo de dados e a API já preveem os pontos de ligação.

### Stack

| Camada | Decisão fixada | Versão | Motivo |
| --- | --- | --- | --- |
| Monorepo | Nx (integrated), pnpm | Nx 21.x, pnpm 10.x | Partilha de tipos, validações e cálculo entre front e API; regras de fronteira por tags |
| Site público | Angular standalone, signals, zoneless, `@angular/ssr` | Angular 22.x | SEO das viaturas e performance no primeiro carregamento |
| Backoffice | Angular SPA (sem SSR) | Angular 22.x | Área autenticada, não indexável |
| Estado | NgRx SignalStore | `@ngrx/signals` compatível com Angular 22 | Store leve baseada em signals, por feature |
| Estilos | Tailwind CSS com tokens do design em `@theme` | Tailwind 4.x | Mapeamento direto dos tokens do Claude Design |
| Ícones e fontes | Phosphor Icons, Archivo e Geist servidos localmente | — | Os do design |
| API | Node.js + TypeScript + Fastify | Node 24 LTS, Fastify 5.x | Simples, rápida, validação por schema e OpenAPI automático |
| Validação | Zod em `libs/contracts` | Zod 4.x | Um único contrato para front e back |
| Base de dados | PostgreSQL + Prisma | PostgreSQL 17, Prisma 6.x | Relacional, migrações versionadas, tipos gerados |
| Imagens | Cloudflare R2 + `sharp`; MinIO em desenvolvimento | — | S3-compatível, sem custos de saída, CDN da Cloudflare |
| Anti-spam | Cloudflare Turnstile + honeypot + rate limit | — | Gratuito e sem desafios visuais |
| Email | Brevo (SMTP transacional); Mailpit em desenvolvimento | — | Servidores na UE, plano gratuito suficiente para o volume |
| Deploy | VPS (ex.: Hetzner) com Docker e Coolify: web SSR, admin estático, API e PostgreSQL; Cloudflare à frente (DNS, CDN, SSL) | — | Custo fixo baixo, tudo no mesmo sítio |
| Testes | Vitest (unitários e componentes, com Angular Testing Library), Playwright (E2E), Supertest + Testcontainers (API) | — | Vitest é o runner por defeito do Angular desde a v21 |
| Observabilidade | pino, Sentry, uptime monitor | — | Logs estruturados e alertas |

As versões são majors fixados à data desta spec; no arranque do projeto usar o último patch de cada major e fixá-lo no lockfile.

### Glossário

- **Viatura**: veículo em stock, publicado ou não.
- **Destaque**: colocação de uma viatura numa zona promocional do site (hero, destaques, novidades), com ordem e período.
- **Produto de financiamento**: conjunto de parâmetros de crédito (TAN, prazos, entrada mínima, comissões) usado pelo simulador.
- **TAN / TAEG / MTIC**: taxa anual nominal, taxa anual de encargos efetiva global e montante total imputado ao consumidor.
- **Lead**: qualquer pedido de contacto gerado pelo site (orçamento, test drive, retoma, financiamento, contacto geral).

## 2. Mapa do design: o que se vê e de onde vem

Cada bloco visível do design corresponde a uma entidade gerida no backoffice. Esta tabela é a referência para garantir que nada fica "hardcoded".

Fonte: `Private Motors.html` (proposta de layout v1 do Claude Design). Esta ronda do design cobre homepage, card e simulador; página de viatura, "Quanto posso pagar?", retoma, comparador e contactos ficam para a ronda seguinte e seguem esta spec até existir layout.

### 2.1 Conceito do design (regras que a implementação tem de respeitar)

1. **Uma barra, duas formas de procurar.** "Procurar por carro" aceita frases ("SUV diesel até 250€/mês") e converte-as em chips; "Quanto posso pagar por mês" troca o preço pela prestação (mensalidade, entrada, prazo).
2. **A homepage é a página de resultados.** Os resultados ficam logo abaixo da pesquisa e atualizam a cada tecla ou filtro, sem recarregar.
3. **Filtros só quando pedidos.** Oito filtros num painel que abre por baixo da barra (bottom sheet em mobile); cada filtro ativo é um chip removível com "Limpar tudo".
4. **A prestação em todo o lado.** Cada card mostra "desde X €/mês" e abre uma gaveta com entrada, prazo e barra capital/juros; no modo orçamento diz quanto sobra ou falta.
5. **Nunca um beco sem saída.** Sem resultados, o site calcula que filtro aliviar e quantas viaturas cada alteração devolve.
6. **Um assistente que pergunta pouco.** Quatro perguntas em chips, três sugestões do stock e um pedido com nome e telemóvel.

### 2.2 Decisões do design por fechar com o cliente

Até o cliente decidir, a implementação usa as recomendações do design: **card 1a** na grelha e **simulador 2a** na página de viatura, com `pm-finance-simulator` preparado para o layout 2b e `pm-vehicle-card` preparado para receber outras variantes. O comparador fica fora do MVP.

- [ ] Card na grelha: 1a (gaveta, em uso no protótipo), 1b (card vira ao clicar) ou 1c (simulador sempre visível). Sugestão do design: 1a na grelha e 1c em "Quanto posso pagar?".
- [ ] Simulador da página de viatura: 2a (sliders e barra de custo), 2b (escolher o prazo num gráfico) ou 2a com o gráfico de 2b.
- [ ] Comparador de viaturas: aparece nos pressupostos do design para a próxima ronda; confirmar se entra no MVP.

### 2.3 Mapa bloco → dados

| Página | Bloco do design | Entidade / fonte de dados | Gerido em (admin) |
| --- | --- | --- | --- |
| Global | Header: logótipo, navegação (Viaturas, Quanto posso pagar?, Retoma, Sobre nós, Contactos), telefone, "Falar connosco" | `SiteSettings`, `NavItem` | Definições |
| Global | Footer: morada, horário, links do stand, telefone, email, "Intermediário de crédito a título acessório", Livro de reclamações, Privacidade | `SiteSettings`, `LegalPage` | Definições, Conteúdo |
| Global | Botão flutuante e painel do assistente | `AssistantSettings`, `AssistantStep` | Assistente |
| Homepage | Linha de stock ("20 viaturas em stock · crédito com resposta no próprio dia") | Contagem da API + `HomeContent.stockTagline` | Conteúdo |
| Homepage | Título e subtítulo do hero | `HomeContent.heroTitle`, `heroSubtitle` | Conteúdo |
| Homepage | Seletor de modo (carro / prestação) | Textos em `HomeContent` | Conteúdo |
| Homepage | Pesquisa inteligente com chips "Entendi:" | Parser `libs/search-parser` + catálogo de marcas/modelos | Catálogos |
| Homepage | "Atalhos" (SUV, Automático, Elétrico, Até 20 000 €, Até 300 €/mês, Menos de 50 000 km) | `QuickFilter` | Conteúdo |
| Homepage | "Ou escreva como falaria" (frases de exemplo) | `SearchExample` | Conteúdo |
| Homepage | Modo orçamento: prestação 100–900 €, entrada 0–20 000 €, prazo 24–96, "cabem" / "ficam perto" | `FinancingProduct` padrão + `Vehicle` | Financiamento |
| Homepage | Grelha de resultados, contagem, ordenação, painel de 8 filtros, "Mostrar mais" | `Vehicle` + catálogos | Viaturas, Catálogos |
| Homepage | Estado vazio com sugestões e "Pedimos o carro por si" | Sugestões calculadas na API; cria `Lead(SOURCING)` | Leads |
| Homepage | "Em destaque · Escolhidas pela equipa esta semana" (cards de 2 colunas, Ver viatura, Test drive) | `FeaturedPlacement(HOME_FEATURED)` | Destaques |
| Homepage | "Comprar aqui é simples e fica tudo por escrito." (4 vantagens com ícone) | `Advantage` | Conteúdo |
| Homepage | "Quem já comprou" + nota Google (4,9 · 312 avaliações) | `Testimonial` + `SiteSettings.googleRating`, `googleReviewCount` | Conteúdo, Definições |
| Homepage | Bloco "Não sabe por onde começar?" com CTA para o assistente | `HomeContent.assistantCta` | Conteúdo |
| Card | Foto, título, versão, meta (ano · km · combustível · caixa), preço, "desde X €/mês", favorito | `Vehicle`, `VehicleImage`, cálculo `libs/finance` | Viaturas |
| Card | Badges Novo, Baixa de preço, Garantia N meses, Destaque | Regras automáticas + `FeaturedPlacement` | Viaturas, Destaques |
| Card | Gaveta: entrada (0 a 50 % do preço), prazo 24–96, barra capital/juros, Capital · Juros · MTIC, nota TAEG | `FinancingProduct` | Financiamento |
| Card (modo orçamento) | "Sobram X € por mês" / "Faltam X € por mês" | Cálculo no cliente | — |
| Detalhe | Galeria, especificações, equipamento, semelhantes | `Vehicle`, `VehicleImage`, `VehicleEquipment` | Viaturas |
| Detalhe | Simulador 2a/2b: prestação, montante financiado, TAN, TAEG, MTIC, exemplo representativo, nota legal, "Pedir aprovação de crédito", WhatsApp | `FinancingProduct` (+ override na viatura) | Financiamento |
| Retoma / orçamento | Formulário de pedido e dados da viatura atual | `Lead` + `TradeIn` | Leads |
| Sobre / contactos | Texto, imagens, mapa, horário | `AboutContent`, `SiteSettings` | Conteúdo, Definições |

## 3. Modelo de dados

PostgreSQL com Prisma. Todas as tabelas têm `id` (UUID), `createdAt`, `updatedAt`; entidades editáveis têm também `createdById` e `updatedById`. Valores monetários em cêntimos (`Int`) para evitar erros de arredondamento; taxas em pontos base (`Int`, 1 % = 100).

### 3.1 Vehicle (viatura)

| Campo | Tipo | Regras |
| --- | --- | --- |
| slug | string, único | Gerado de marca-modelo-versão-ano, editável |
| status | enum `DRAFT`, `PUBLISHED`, `RESERVED`, `SOLD`, `ARCHIVED` | Só `PUBLISHED` e `RESERVED` aparecem no site |
| condition | enum `NEW`, `USED`, `NEARLY_NEW` | Obrigatório |
| brandId / modelId | FK | Obrigatório; modelo tem de pertencer à marca |
| version | string ≤ 120 | Ex.: "1.5 BlueHDi GT Line EAT8" |
| registrationDate | date (mês/ano) | Não futura; o design mostra só o ano |
| mileageKm | int ≥ 0 | Obrigatório |
| fuel | enum `PETROL` (Gasolina), `DIESEL`, `HYBRID` (Híbrido), `PHEV` (Plug-in), `ELECTRIC` (Elétrico), `LPG` (GPL) | Os 5 primeiros são os do filtro do design |
| transmission | enum `MANUAL`, `AUTOMATIC` (Automática) | Obrigatório |
| bodyType | enum `SUV`, `ESTATE` (Carrinha), `SEDAN` (Berlina), `CITY` (Utilitário), `COUPE` (Coupé), `CABRIO`, `MPV`, `VAN` | Os 5 primeiros são os do filtro do design |
| powerHp, engineCc, doors, seats | int | `powerHp` aparece no card de destaque ("130 cv"); `engineCc` opcional em elétricos |
| batteryKwh, rangeKm | int | Só elétricos/PHEV |
| color, colorInterior | string | Opcional |
| priceCents | int > 0 | Preço de venda com IVA (PVP) |
| previousPriceCents | int, opcional | Se maior que `priceCents`, ativa badge "Baixa de preço" |
| vatDeductible | boolean | Mostra "IVA dedutível" |
| warrantyMonths | int | Mostra "Garantia N meses"; ≥ 18 em usados vendidos por profissional (validar com o stand) |
| description | texto rico (markdown limitado) | ≤ 5000 caracteres |
| financingEnabled | boolean | Se falso, não mostra prestação nem gaveta |
| financingProductId | FK opcional | Override do produto padrão |
| seoTitle, seoDescription | string | Opcional, com fallback automático |
| publishedAt, reservedAt, soldAt | datetime | Preenchidos pela mudança de estado; `publishedAt` ordena "Mais recentes" |
| viewCount, favoriteCount | int | Incrementados pela API |
| externalRef | string opcional | Referência Standvirtual (fase 2) |

Relações: `VehicleImage[]`, `VehicleEquipment[]`, `VehicleBadge[]`, `FeaturedPlacement[]`, `Lead[]`.

### 3.2 Restantes entidades

| Entidade | Campos principais | Notas |
| --- | --- | --- |
| VehicleImage | vehicleId, storageKey, variants (JSON: thumb 400w, card 800w, full 1600w), alt, position, isCover, width, height | Máx. 40 fotos; exatamente 1 capa por viatura |
| Brand | name, slug, logoUrl, aliases\[\] (ex.: "vw", "mercedes"), active | `aliases` alimentam o parser da pesquisa |
| Model | brandId, name, slug, aliases\[\], active | Único por marca |
| EquipmentItem | name, category (`SAFETY`, `COMFORT`, `MULTIMEDIA`, `EXTERIOR`, `INTERIOR`, `DRIVING`), active | Catálogo reutilizável |
| VehicleEquipment | vehicleId, equipmentItemId | N:N |
| Badge | label, style token, kind (`MANUAL`, `AUTO_NEW`, `AUTO_PRICE_DROP`, `AUTO_WARRANTY`, `AUTO_FEATURED`, `AUTO_RESERVED`), active | Automáticos calculados na API |
| FeaturedPlacement | vehicleId, placement (`HOME_FEATURED`, `BUDGET_SUGGESTIONS`, `ASSISTANT_BOOST`), position, label opcional, startsAt, endsAt opcionais, active | Viatura vendida sai automaticamente; `HOME_FEATURED` mostra 2 cards por defeito |
| FinancingProduct | name, lenderName, isDefault, active, rateMode (`TAEG_INPUT` ou `TAN_AND_FEES`), taegBp, tanBp, allowedTerms\[\] (padrão 24, 36, 48, 60, 72, 84, 96), defaultTermMonths (padrão 96), defaultDownPaymentPct (padrão 0), maxDownPaymentPct (padrão 50), minFinancedCents, maxFinancedCents, openingFeeCents, monthlyFeeCents, stampDutyRateBp, maxVehicleAgeAtEndYears, budgetNearPct (padrão 15), representativeExampleTemplate, legalNote, validFrom, validTo | Apenas 1 `isDefault` ativo; ver 4.3 |
| Lead | type (`QUOTE`, `TEST_DRIVE`, `CONTACT`, `TRADE_IN`, `FINANCING`, `SOURCING` = "pedimos o carro por si"), source (`VEHICLE_PAGE`, `HOME_SEARCH`, `BUDGET_SEARCH`, `EMPTY_STATE`, `QUOTE_FORM`, `CONTACT_PAGE`, `WHATSAPP`, `ASSISTANT`), vehicleId opcional, name, email opcional, phone, preferredContact, preferredDate, message, searchSnapshot (JSON dos filtros), simulationSnapshot (JSON), assistantAnswers (JSON), status (`NEW`, `CONTACTED`, `QUALIFIED`, `WON`, `LOST`), assignedToId, utm (JSON), consentPrivacy, consentMarketing, consentAt | Telemóvel PT validado (`9[1236]` + 7 dígitos ou fixo `2` + 8); consentimento RGPD obrigatório |
| TradeIn | leadId, brand, model, version, year, mileageKm, fuel, condition, notes, photos\[\] | Até 10 fotos |
| LeadNote | leadId, authorId, text | Histórico comercial |
| Testimonial | authorName, initials (auto), text, vehicleLabel ("Comprou um Toyota C-HR"), photoUrl opcional, position, active |  |
| Advantage | icon (nome Phosphor, ex.: `shield-check`), title, text, position, active | O design usa 4 |
| QuickFilter | label, filters (JSON com os mesmos parâmetros da pesquisa), position, active | "Atalhos" da homepage |
| SearchExample | text, position, active | "Ou escreva como falaria"; ao clicar preenche a barra |
| NavItem | label, route ou url, position, active | Menu do header e links do footer |
| HomeContent | heroTitle, heroSubtitle, stockTagline, searchPlaceholder, modeCarLabel, modeBudgetLabel, featuredTitle, featuredSubtitle, advantagesTitle, testimonialsTitle, assistantCtaTitle, assistantCtaText, assistantCtaButton | Singleton |
| AboutContent | title, body, images\[\], teamPhotoUrl | Singleton |
| SiteSettings | companyName, nif, creditIntermediaryText, address, postalCode, locality, lat, lng, phones\[\], email, whatsapp, openingHours (JSON por dia + exceções), socialLinks (JSON), googleRating, googleReviewCount, googleReviewsUrl, complaintsBookUrl, defaultSeo (JSON), logoUrl, faviconUrl, newBadgeDays (padrão 3) | Singleton |
| LegalPage | slug (`privacidade`, `cookies`, `termos`), title, body, updatedAt |  |
| AssistantSettings | enabled, botName, statusText, welcomeMessage, entryChips\[\], handoffMessage, confirmationTemplate | MVP (guiado por regras) |
| AssistantStep | key (`uso`, `fam`, `orc`, `fuel`), question, position, options\[\] (label + regras de pontuação JSON, ex.: `{fuel: ['DIESEL'], score: 3}`) | Editável no admin; motor de pontuação em `libs/assistant` |
| User | name, email, passwordHash (argon2), role (`ADMIN`, `EDITOR`, `SALES`), active, lastLoginAt |  |
| RefreshToken | userId, tokenHash, expiresAt, revokedAt | Rotação a cada uso |
| AuditLog | userId, action, entity, entityId, diff (JSON), createdAt | Todas as escritas do admin |

### 3.3 Regras derivadas (calculadas na API, nunca guardadas à mão)

- **Badge "Novo"**: `publishedAt` há até `newBadgeDays` dias (3 no design).
- **Badge "Baixa de preço"**: `previousPriceCents > priceCents`.
- **Badge "Garantia N meses"**: `warrantyMonths > 0`.
- **Badge "Destaque"**: viatura com `FeaturedPlacement(HOME_FEATURED)` ativo, só no card de destaque.
- **Prestação "desde"**: produto aplicável, entrada padrão (0 €) e prazo padrão (96 meses), limitado pela idade máxima da viatura no fim do contrato.
- **Semelhantes**: mesma carroçaria, preço ±20 %, excluindo a própria, máx. 8, ordenadas por proximidade de preço.

### 3.4 CRM de leads

Cada lead fica ligada a um **contacto** único, para que o stand veja o histórico completo de cada cliente (pedidos, viaturas de interesse, retomas, conversas) e possa voltar a trabalhar esses dados mais tarde. O lead é a oportunidade; o contacto é a pessoa.

| Entidade | Campos principais | Regras |
| --- | --- | --- |
| Contact | name, phone (normalizado E.164), email, locality, preferredContact, tags\[\], ownerId (comercial), lifecycle (`LEAD`, `PROSPECT`, `CUSTOMER`, `INACTIVE`), firstSource, lastInteractionAt, consentPrivacy, consentMarketing, consentAt, consentSource, anonymizedAt | Deduplicação automática por telemóvel e depois por email; um novo pedido do mesmo cliente junta-se ao contacto existente |
| Lead (alterações) | + contactId, + stage do pipeline, + estimatedValueCents (preço da viatura ou orçamento indicado), + expectedCloseDate, + lostReason (`PRICE`, `FINANCING_REJECTED`, `BOUGHT_ELSEWHERE`, `NO_RESPONSE`, `VEHICLE_SOLD`, `OTHER`), + wonVehicleId | `status` passa a ser a etapa do pipeline; `WON` exige viatura vendida, `LOST` exige motivo |
| PipelineStage | name, position, kind (`OPEN`, `WON`, `LOST`), color token | Configurável no admin; padrão: Novo → Contactado → Visita/test drive → Proposta → Crédito em análise → Ganho / Perdido |
| Activity | contactId, leadId opcional, type (`CALL`, `WHATSAPP`, `EMAIL`, `SMS`, `VISIT`, `TEST_DRIVE`, `NOTE`, `STAGE_CHANGE`, `SYSTEM`), direction (`IN`, `OUT`), summary, occurredAt, authorId | Linha do tempo do contacto; mudanças de etapa e novos pedidos são registados automaticamente (substitui `LeadNote`) |
| Task | contactId, leadId opcional, title, dueAt, assigneeId, status (`OPEN`, `DONE`, `CANCELLED`), completedAt | Tarefa "Ligar ao cliente" criada automaticamente em cada lead novo, com prazo de 2 horas úteis |
| Tag | name, color token | Segmentação livre (ex.: "procura SUV", "retoma pendente", "frota") |
| VehicleInterest | contactId, vehicleId opcional, criteria (JSON de filtros), source, createdAt | Guarda o que o cliente procurou; permite avisá-lo quando entrar uma viatura compatível |

Regras de dados: só contactos com `consentMarketing` entram em exportações para campanhas; o registo do consentimento (data, texto aceite e origem) é imutável; contactos sem interação há 24 meses são anonimizados automaticamente, exceto clientes com venda (retidos pelo prazo legal de faturação).

## 4. Requisitos funcionais — site público

O site público é só de leitura, exceto a criação de leads. Todos os filtros vivem no URL (query params), para que qualquer pesquisa seja partilhável, indexável e sobreviva a um refresh.

### 4.1 Rotas

| Rota | Página | Render |
| --- | --- | --- |
| `/` | Homepage = pesquisa + resultados (modo carro) | SSR da 1.ª página + client |
| `/?modo=prestacao` | Homepage em modo orçamento (link "Quanto posso pagar?" do menu) | SSR + client |
| `/viaturas` | Mesma página de pesquisa, com filtros no URL, para SEO e partilha (ex.: `/viaturas?carrocaria=suv&combustivel=diesel`) | SSR + client |
| `/viaturas/:slug` | Detalhe da viatura | SSR + dados estruturados `schema.org/Car` |
| `/retoma` | Pedido de avaliação de retoma | CSR |
| `/orcamento` | Pedido de orçamento (aceita `?viatura=:slug`) | CSR |
| `/sobre` | Sobre nós | SSR |
| `/contactos` | Contactos, mapa e horário | SSR |
| `/privacidade`, `/cookies`, `/termos` | Páginas legais | SSR |
| `**` | 404 com sugestões de viaturas | SSR |

### 4.2 Requisitos

**RF-P01 Pesquisa inteligente.** A barra aceita texto livre e converte-o em filtros por regras (marcas, modelos e aliases do catálogo; sinónimos como "gasóleo", "jipe", "carrinha familiar", "citadino", "DSG"; padrões "até 250€/mês", "até 25 mil euros", "desde 2020", "menos de 60 000 km"). Enquanto escreve, os filtros reconhecidos aparecem como chips pendentes (tracejados) na linha "Entendi:" e os resultados já os aplicam; Enter ou "Procurar" fixa-os como chips ativos e limpa a barra. Valores até 1 500 depois de "até" são prestação, acima disso preço. O parser vive em `libs/search-parser` e corre no browser, sem pedido à API.

**RF-P02 Filtros.** Oito filtros num painel que abre sob a barra (bottom sheet em mobile, com botão "Ver N viaturas"): marca, modelo (desativado até escolher marca), preço até (slider até 60 000 € = sem limite), prestação até (slider até 900 €/mês = sem limite), ano a partir de (pills), quilómetros (< 30 000, < 60 000, < 100 000), combustível (multi), caixa (Todas/Manual/Automática) e carroçaria (multi). O botão "Filtros" mostra o número de filtros ativos; cada filtro ativo é um chip removível, com "Limpar tudo". Remover a marca remove também o modelo.

**RF-P03 Resultados em tempo real.** Qualquer alteração (tecla, chip, filtro, modo) atualiza a grelha e o URL; pedidos à API com debounce de 300 ms e cancelamento do anterior. Contagem no topo ("20 viaturas em stock", "N viaturas", "N viaturas para o seu orçamento"). 9 viaturas por página com botão "Mostrar mais 9 de N". Skeleton cards durante o carregamento.

**RF-P04 Ordenação.** Mais recentes (padrão), Preço, Prestação, Quilómetros (todos ascendentes, como no design).

**RF-P05 Estado vazio.** "Nenhuma viatura com esta combinação": a API testa remover cada chip ativo e, no modo orçamento, subir a prestação em +50 € e +100 € e alargar o prazo para 96 meses; mostra as 3 alterações com mais resultados, cada uma com a contagem ("Remover 'Diesel' · 4 viaturas"). Inclui "Não encontra o que quer? Pedimos o carro por si" (cria lead `SOURCING` com o snapshot da pesquisa) e "Limpar filtros".

**RF-P06 Card de viatura (variante 1a).** Foto de capa, badges, favorito, marca + modelo, versão, meta (ano · km · combustível · caixa), "desde X €/mês" e preço. "Ajustar prestação" abre uma gaveta com slider de entrada (0 € até 50 % do preço, passos de 500 €), prazos 24–96 em botões, barra capital/juros, linha "Capital · Juros · MTIC" e nota "TAEG X %. Simulação indicativa, sujeita a aprovação." Os ajustes ficam guardados por viatura durante a sessão. Variantes: normal (grelha), destaque (2 colunas na home, com cv, "Ver viatura" e "Test drive") e compacto (dentro do assistente).

**RF-P07 Detalhe.** Galeria com zoom e swipe, especificações, equipamento por categoria, descrição, simulador completo, CTAs (pedir contacto, marcar test drive, WhatsApp com mensagem pré-preenchida com a viatura), viaturas semelhantes. Viatura `RESERVED` mostra badge "Reservado" e desativa test drive. Viatura `SOLD` devolve 410 com sugestões (ou redireciona para a listagem filtrada pelo mesmo modelo).

**RF-P08 Simulador da página de viatura (variante 2a, com 2b opcional).** Prestação mensal em destaque (com cêntimos), slider de entrada (0 € até 50 % do preço), prazos 24–96, barra de custo entrada/capital/juros, tabela com montante financiado, TAN (fixa), TAEG e MTIC, exemplo representativo gerado a partir do template do produto, nota legal, "Pedir aprovação de crédito" (cria lead `FINANCING` com o snapshot) e WhatsApp. A variante 2b mostra um gráfico de colunas com a prestação por prazo, onde tocar numa coluna escolhe o prazo. O cálculo corre no browser com `libs/finance`, sem pedidos por cada movimento.

**RF-P09 Modo "Quanto posso pagar por mês".** Na homepage, o seletor de modo troca a pesquisa por: prestação (slider 100–900 €), entrada disponível opcional (0–20 000 €, "Sem entrada") e prazo (24–96). A grelha mostra primeiro as viaturas que cabem e depois as que ficam até 15 % acima (`budgetNearPct`), com os contadores "N cabem no orçamento" e "N ficam perto" e, em cada card, "Sobram X € por mês" (verde) ou "Faltam X € por mês" (âmbar). Os restantes filtros continuam disponíveis. Nota "TAEG X % · valores indicativos".

**RF-P10 Orçamento e retoma.** Formulário em passos: 1) viatura de interesse (opcional, pré-preenchida pelo query param); 2) retoma (sim/não, dados e até 10 fotos); 3) contactos e consentimentos. Validação inline, proteção anti-spam (honeypot + rate limit + Cloudflare Turnstile) e ecrã de confirmação.

**RF-P11 Sobre e contactos.** Texto e imagens do `AboutContent`, mapa (embed ou Leaflet com OpenStreetMap), horário com indicação "Aberto agora", telefones com `tel:`, email, WhatsApp e formulário de contacto simples.

**RF-P12 Rastreamento.** Cada lead guarda UTM e página de origem. Visualizações de detalhe incrementam `viewCount` (1 por sessão).

**RF-P13 Cookies e RGPD.** Banner de consentimento; analytics só carrega após consentimento. Link para o Livro de Reclamações eletrónico no footer.

**RF-P14 Favoritos.** Coração no card guarda a viatura no browser (localStorage, sem conta) e incrementa `favoriteCount` na API. Lista de favoritos acessível a partir do header.

**RF-P15 Assistente guiado.** Botão flutuante que abre painel lateral de 420 px em desktop e ecrã inteiro em mobile. Fluxo: boas-vindas com chips "Ajudem-me a escolher" / "Quero um orçamento"; quatro perguntas (uso, quem viaja, prestação confortável, combustível) com indicador "a escrever"; três mini-cards do stock escolhidos por pontuação (se nenhuma cabe no orçamento, mostra as mais próximas e diz isso); formulário com nome e telemóvel; confirmação com o primeiro nome. Chips "Pedir orçamento personalizado" e "Recomeçar". Perguntas, opções e regras de pontuação vêm de `AssistantStep`; a recomendação é calculada na API (`POST /public/assistant/recommend`) para usar o stock real.

### 4.3 Cálculo de financiamento

Prestação constante (sistema francês), com taxa mensal i = TAN / 12, montante financiado C e n meses:

```latex
P = C \cdot \frac{i}{1 - (1 + i)^{-n}}
```

O produto de financiamento suporta dois modos. Em `TAEG_INPUT` (o do protótipo: TAEG 15 %, sem comissões) a taxa mensal deriva da TAEG, i = (1 + TAEG)^(1/12) − 1, e a TAN fixa mostrada é i × 12; C = preço − entrada. Em `TAN_AND_FEES` (quando a financeira der as condições reais), i = TAN / 12, C inclui comissão de abertura e imposto do selo quando financiados, e a TAEG é calculada iterativamente (taxa que iguala o valor atual dos pagamentos ao montante recebido). Em ambos, MTIC = prestações + comissões + encargos, e juros = MTIC − C. Arredondamentos ao cêntimo por prestação. A função vive em `libs/finance`, partilhada por front e API, com testes contra os valores do protótipo e contra simulações reais da financeira.

- [ ] Obter da financeira parceira: TAN, comissões, imposto do selo aplicável, prazos, entrada mínima, idade máxima da viatura e 3 simulações reais para testar o cálculo.

## 5. Requisitos funcionais — backoffice

O backoffice gere tudo o que aparece no site, em português de Portugal, desktop-first mas usável em tablet. Cada ecrã de lista tem pesquisa, filtros, ordenação, paginação server-side e ações em massa quando fizer sentido.

### 5.1 Perfis e permissões

| Módulo | ADMIN | EDITOR | SALES |
| --- | --- | --- | --- |
| Dashboard | Ver | Ver | Ver |
| Viaturas e fotos | Total | Total | Ver + mudar estado (reservar/vender) |
| Destaques | Total | Total | — |
| Financiamento | Total | Ver | Ver |
| Leads | Total | Ver | Total nos atribuídos + não atribuídos |
| Conteúdo (home, sobre, vantagens, testemunhos, filtros rápidos, legais) | Total | Total | — |
| Catálogos (marcas, modelos, equipamento, badges) | Total | Total | — |
| Definições do site | Total | — | — |
| Utilizadores e auditoria | Total | — | — |

### 5.2 Requisitos

**RF-A01 Login.** Email + password, bloqueio temporário após 5 tentativas falhadas, recuperação por email com token de uso único (validade 30 min). Sessão com access token de 15 min e refresh token em cookie httpOnly com rotação.

**RF-A02 Dashboard.** Viaturas publicadas, reservadas e vendidas no mês; leads novos (hoje/7 dias) por tipo; viaturas mais vistas; viaturas publicadas há mais de 90 dias sem leads; atalhos para "Nova viatura" e "Leads por tratar".

**RF-A03 Lista de viaturas.** Tabela com foto, marca/modelo, ano, km, preço, estado, dias em stock, leads, visualizações. Filtros por estado, marca, combustível, com/sem fotos. Ações: publicar, despublicar, reservar, vender, arquivar, duplicar.

**RF-A04 Formulário de viatura.** Separadores: Dados gerais, Preço e garantia, Equipamento (checklist por categoria com pesquisa), Fotos, Financiamento (ativar, produto específico, pré-visualização da prestação), SEO, Pré-visualização. Rascunho guardado automaticamente a cada 30 s. Publicar valida: ≥ 1 foto de capa, preço, campos obrigatórios. Alterar preço para baixo sugere preencher `previousPrice`.

**RF-A05 Fotos.** Upload múltiplo por drag-and-drop (JPEG/PNG/HEIC, máx. 15 MB cada, até 40), barra de progresso, reordenação por arrastar, definir capa, editar texto alternativo, eliminar. A API gera as variantes e remove metadados EXIF (incluindo GPS).

**RF-A06 Destaques.** Um ecrã por zona: "Em destaque" da homepage (2 viaturas por defeito, título e subtítulo editáveis), sugestões no modo orçamento e reforço nas recomendações do assistente. Adicionar viatura por pesquisa, reordenar por arrastar, rótulo opcional, período de início/fim e pré-visualização com o card de destaque real. Viaturas vendidas ou despublicadas aparecem marcadas e deixam de ser mostradas no site.

**RF-A07 Financiamento.** CRUD de produtos de financiamento com todos os parâmetros da secção 3.2, marcar produto padrão, validade. Simulador de teste embutido que mostra prestação, TAEG e MTIC para um preço, entrada e prazo à escolha, para comparar com as simulações da financeira antes de ativar. Histórico de alterações.

**RF-A08 CRM (leads e contactos).** Módulo com quatro vistas:

- **Pipeline:** kanban por etapa com arrastar entre colunas, valor total por etapa, filtros por comercial, origem, tipo de pedido e período. Passar a Ganho pede a viatura vendida (e marca-a como `SOLD`); passar a Perdido pede o motivo.
- **Contactos:** lista com pesquisa, tags, etapa do lead mais recente, última interação e comercial. A ficha do contacto mostra dados e consentimentos, todos os leads, viaturas de interesse, retomas com fotos, simulações feitas, linha do tempo de atividades e tarefas. Ações rápidas: ligar, WhatsApp e email (cada uma regista uma atividade), juntar contactos duplicados, anonimizar.
- **Tarefas:** "As minhas tarefas" de hoje e em atraso, com conclusão num clique; o dashboard mostra as tarefas em atraso por comercial.
- **Relatórios:** leads por origem e por semana, taxa de conversão por etapa, tempo médio até ao primeiro contacto, motivos de perda e vendas por comercial.

Automatismos: email ao stand e tarefa "Ligar ao cliente" em cada lead novo; atribuição por rotação entre comerciais ativos (ou manual); alerta de lead sem contacto após 24 h; aviso ao comercial quando entra uma viatura compatível com um `VehicleInterest` aberto. Exportação CSV de contactos e leads (só com consentimento de marketing para fins de campanha) e importação CSV de contactos existentes. O perfil SALES vê e gere os seus contactos e os não atribuídos.

**RF-A09 Conteúdo.** Editores para Homepage (título e subtítulo do hero, linha de stock, rótulos dos modos, títulos das secções, bloco do assistente), Atalhos (`QuickFilter`, construídos com o mesmo painel de filtros do site), Frases de exemplo da pesquisa, Vantagens (ícone Phosphor com pré-visualização, título, texto, ordem), Testemunhos (texto, nome, viatura comprada, ordem, ativo), Navegação do header/footer, Sobre e Páginas legais (editor de texto rico limitado).

**RF-A10 Catálogos.** Marcas (com logótipo), modelos por marca, itens de equipamento por categoria, badges manuais. Não permite eliminar itens em uso; permite desativar.

**RF-A11 Definições.** Dados da empresa, contactos, WhatsApp, morada e coordenadas (com pré-visualização do mapa), horário por dia com exceções (feriados), redes sociais, SEO por defeito, logótipo e favicon, dias para o badge "Novo".

**RF-A12 Utilizadores e auditoria.** CRUD de utilizadores, convite por email, ativar/desativar, mudar perfil. Registo de auditoria filtrável por utilizador, entidade e data.

**RF-A13 Invalidação de cache.** Qualquer escrita que afete o site público invalida a cache correspondente (listagens, detalhe, home) na API/CDN, para que a alteração apareça em menos de 1 minuto.

**RF-A14 Assistente.** (ADMIN e EDITOR) Ativar/desativar, nome e estado do bot, mensagem de boas-vindas, chips de entrada, mensagem de passagem para orçamento e template de confirmação. Editor das perguntas (`AssistantStep`): texto, ordem e opções, cada opção com regras de pontuação escolhidas por formulário (combustível, carroçaria, prestação máxima, pontos). Botão "Testar" que corre o fluxo contra o stock atual e mostra as 3 viaturas recomendadas.

**RF-A15 Parser da pesquisa.** (ADMIN e EDITOR) Lista de sinónimos editável (ex.: "jipe" → SUV, "gasóleo" → Diesel) e campo de teste que mostra os chips que uma frase gera. Aliases de marcas e modelos editam-se nos catálogos.

## 6. API Node.js

Uma única API REST, versionada em `/api/v1`, com dois grupos: `/public` (sem autenticação, cacheável) e `/admin` (JWT + perfil). Contratos definidos em Zod em `libs/contracts`, de onde saem a validação da API, os tipos do Angular e o OpenAPI em `/api/docs`.

### 6.1 Arquitetura em camadas

```
apps/api/src/
  main.ts                 # bootstrap Fastify, plugins, graceful shutdown
  config/                 # env validada com Zod (DATABASE_URL, JWT_*, S3_*, SMTP_*)
  plugins/                # prisma, auth, cors, helmet, rate-limit, swagger, multipart
  modules/
    vehicles/
      vehicles.routes.ts      # só HTTP: schema, auth, chama o controller
      vehicles.controller.ts  # traduz request/response, sem regras de negócio
      vehicles.service.ts     # regras de negócio, orquestração, cache
      vehicles.repository.ts  # único ponto de acesso ao Prisma
      vehicles.mapper.ts      # entidade -> DTO público / DTO admin
      vehicles.test.ts
    images/ featured/ financing/ leads/ content/ catalog/ settings/ users/ auth/ audit/
  shared/                 # errors, pagination, slug, storage (S3), mailer, cache
prisma/
  schema.prisma  migrations/  seed.ts
```

Regras: routes não tocam no Prisma; services não conhecem Fastify; repositories não têm regras de negócio. Os DTOs públicos nunca expõem campos internos (custos, notas, `createdById`).

### 6.2 Endpoints públicos

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/public/site` | Layout e home num só pedido: `SiteSettings`, `HomeContent`, navegação, vantagens, testemunhos, atalhos, frases de exemplo, contagem de stock, produto de financiamento padrão (parâmetros públicos), dicionário do parser (marcas, modelos, aliases, sinónimos) e `AssistantSettings` + passos |
| GET | `/public/featured?placement=HOME_FEATURED` | Viaturas em destaque por zona |
| GET | `/public/vehicles` | Pesquisa com filtros, ordenação, paginação e facetas; no modo orçamento devolve `fits` e `near` |
| GET | `/public/vehicles/suggestions` | Para o estado vazio: alterações de filtro possíveis e quantas viaturas cada uma devolve |
| GET | `/public/vehicles/:slug` | Detalhe completo |
| GET | `/public/vehicles/:slug/similar` | Até 8 semelhantes |
| POST | `/public/vehicles/:slug/view` | Regista visualização (1 por sessão) |
| POST | `/public/vehicles/:slug/favorite` | Incrementa/decrementa `favoriteCount` (`{ on: boolean }`) |
| POST | `/public/assistant/recommend` | Respostas do assistente → 3 viaturas + `exact` (true se cabem no orçamento) |
| GET | `/public/pages/:slug` | Páginas legais e sobre |
| POST | `/public/leads` | Cria lead (multipart quando tem fotos de retoma) |

Parâmetros de `/public/vehicles` (nomes em inglês na API; o site usa aliases PT no URL): `brand`, `model`, `priceMax`, `monthlyMax`, `yearMin`, `kmMax`, `fuel` (múltiplos por vírgula), `transmission`, `body` (múltiplos), `sort` (`recent`, `price`, `monthly`, `km`), `down` e `term` (entrada e prazo usados para calcular e filtrar a prestação; padrão do produto), `budget` (ativa o modo orçamento: devolve primeiro as que cabem e depois as até `budgetNearPct` acima), `page`, `pageSize` (padrão 9, máx. 48).

Resposta paginada:

```json
{
  "data": [{ "slug": "vw-golf-1-5-tsi-2021", "title": "Volkswagen Golf 1.5 TSI Style", "priceCents": 2249000, "monthlyFromCents": 28900, "badges": ["PRICE_DROP"], "cover": { "card": "https://cdn/.../800.webp", "alt": "..." } }],
  "meta": { "page": 1, "pageSize": 24, "total": 87 },
  "facets": { "fuel": { "DIESEL": 31, "PETROL": 40 }, "body": { "SUV": 22 } },
  "relaxed": null
}
```

### 6.3 Endpoints admin

Todos em `/admin`, com `Authorization: Bearer`. Padrão REST igual para cada recurso: `GET /x` (lista paginada), `GET /x/:id`, `POST /x`, `PATCH /x/:id`, `DELETE /x/:id`.

| Recurso | Rotas específicas além do CRUD |
| --- | --- |
| `auth` | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/forgot`, `POST /auth/reset`, `GET /auth/me` |
| `vehicles` | `POST /vehicles/:id/status` (publicar, reservar, vender, arquivar), `POST /vehicles/:id/duplicate` |
| `vehicles/:id/images` | `POST` (multipart, várias), `PATCH /reorder`, `PATCH /:imageId` (alt, capa), `DELETE /:imageId` |
| `featured` | `GET ?placement=`, `PUT /:placement` (substitui a lista ordenada inteira) |
| `financing-products` | `POST /:id/default`, `POST /simulate` |
| `leads` | `PATCH /:id/status`, `PATCH /:id/assign`, `POST /:id/notes`, `GET /export.csv`, `POST /:id/anonymize` |
| `content` | `GET/PUT /home`, `GET/PUT /about`, CRUD `advantages`, `testimonials`, `quick-filters`, `search-examples`, `nav-items`, `legal-pages`, `PATCH /:type/reorder` |
| `catalog` | CRUD `brands`, `models`, `equipment`, `badges`, `search-synonyms`; `POST /search/parse-test` |
| `assistant` | `GET/PUT /assistant/settings`, CRUD `/assistant/steps`, `PATCH /assistant/steps/reorder`, `POST /assistant/test` |
| `settings` | `GET/PUT /settings` |
| `users` | CRUD + `POST /:id/invite` |
| `audit` | `GET /audit` |
| `dashboard` | `GET /dashboard/summary` |

CRM: `GET/POST/PATCH /contacts` (+ `POST /contacts/merge`, `POST /contacts/import`, `GET /contacts/export.csv`, `POST /contacts/:id/anonymize`), `GET/POST /contacts/:id/activities`, CRUD `/tasks` (+ `GET /tasks/mine`), CRUD `/pipeline-stages` (+ `PATCH /reorder`), CRUD `/tags`, `GET /crm/reports`. Em `POST /public/leads` a API procura ou cria o contacto, cria o lead na primeira etapa, regista a atividade e gera a tarefa inicial numa só transação.

### 6.4 Convenções

- **Erros** no formato RFC 9457 (`application/problem+json`): `type`, `title`, `status`, `detail`, `errors[]` por campo. Códigos: 400 validação, 401, 403, 404, 409 conflito (slug duplicado, item em uso), 410 viatura vendida, 422 regra de negócio, 429.
- **Concorrência**: `PATCH` aceita `If-Match` com `updatedAt`/versão; conflito devolve 409.
- **Segurança**: helmet, CORS restrito aos domínios do site e do admin, rate limit (público: 120 req/min por IP; leads: 5/hora por IP), passwords com argon2id, JWT de acesso 15 min, refresh 30 dias em cookie `httpOnly; Secure; SameSite=Strict`.
- **Cache**: respostas públicas com `Cache-Control: public, max-age=60, stale-while-revalidate=300` e ETag; invalidação por tags nas escritas do admin.
- **Imagens**: upload para Cloudflare R2 (MinIO em desenvolvimento), processamento com `sharp` (WebP + AVIF, 400/800/1600 px, remoção de EXIF), servidas por CDN.
- **Emails**: notificação de novo lead ao stand e confirmação ao cliente, via SMTP transacional (Brevo).
- **Observabilidade**: logs estruturados (pino) com request id, `/health` e `/ready`, erros enviados para Sentry.
- **Seed**: script com catálogo de marcas/modelos comuns em Portugal, 1 admin, produto de financiamento exemplo e 20 viaturas fictícias.

## 7. Arquitetura Angular

Duas aplicações (site e admin) num monorepo, organizadas por feature e por camada, com dependências só num sentido: `feature → data-access → contracts`, e `feature → ui`. Um componente de UI nunca chama HTTP; um serviço de API nunca guarda estado.

### 7.1 Estrutura do monorepo

```
apps/
  web/                 # site público (SSR)
  admin/               # backoffice (SPA)
  api/                 # Node/Fastify
libs/
  contracts/           # schemas Zod + tipos (Vehicle, Lead, FilterState, DTOs)
  finance/             # prestação, TAN<->TAEG, MTIC, exemplo representativo (puro)
  search-parser/       # texto livre -> FilterState, chips, remoção de chip (puro)
  assistant/           # motor de pontuação das respostas do assistente (puro)
  shared/ui/           # componentes base Tailwind (button, input, chip, slider, sheet, skeleton...)
  shared/util/         # formatação € (pt-PT, espaço fino), km, datas, slug
  web/data-access/     # clientes HTTP + stores do site
  web/feature-*/       # search-home, vehicle-detail, trade-in, quote, about, contacts, assistant
  admin/data-access/   # clientes HTTP + stores do admin
  admin/feature-*/     # vehicles, featured, financing, leads, content, catalog, assistant, settings, users
```

Regras de fronteira aplicadas com tags do Nx (`scope:web`, `scope:admin`, `type:feature|ui|data-access|util`) e `@nx/enforce-module-boundaries` no ESLint.

### 7.2 Camadas dentro de uma feature

| Camada | Responsabilidade | Exemplo |
| --- | --- | --- |
| Página (container) | Liga rota, store e componentes; sem lógica de negócio | `ListingPage` |
| Componentes de apresentação | `input()`/`output()` apenas, `OnPush`, sem injeção de serviços | `VehicleCard`, `FilterChips` |
| Store (SignalStore) | Estado, computed, métodos que chamam a API, efeitos com `rxMethod` | `VehicleSearchStore` |
| API client | Pedidos HTTP tipados com os contratos, sem estado | `VehiclesApi` |
| Util / domínio puro | Cálculos e parsing testáveis sem Angular | `libs/finance` |

### 7.3 Stores (NgRx SignalStore)

| Store | Âmbito | Estado principal |
| --- | --- | --- |
| `SiteStore` | root (web) | settings, home content, navegação, vantagens, testemunhos, atalhos, frases de exemplo, dicionário do parser; carregado uma vez e transferido do SSR |
| `FinancingStore` | root (web) | produto padrão; método `quote(price, down, term)` via `libs/finance` |
| `SearchStore` | rota `/` e `/viaturas` | `mode` (`car` / `budget`), `query` (texto na barra), `parsed` (chips pendentes, `computed`), `filters` (chips fixos, sincronizados com o URL), `budget` { monthly, down, term }, `sort`, resultados, facetas, `limit`, `panelOpen`, sugestões do estado vazio, loading |
| `CardSimulationStore` | root (web) | ajustes de entrada/prazo por viatura (`Record<vehicleId, {down, term}>`) e card aberto; mantidos durante a sessão |
| `FavoritesStore` | root (web) | ids favoritos, persistidos em localStorage com `withHooks` |
| `AssistantStore` | root (web) | aberto/fechado, passo, respostas, mensagens, chips, `typing`, recomendações, formulário e estado de envio |
| `VehicleDetailStore` | rota detalhe | viatura, semelhantes, simulação 2a/2b |
| `LeadFormStore` | rotas retoma e orçamento | passos, dados, uploads, estado de envio |
| `AuthStore` | root (admin) | utilizador, perfil, token em memória, refresh |
| `VehiclesAdminStore`, `LeadsAdminStore`, `FeaturedStore`, `FinancingAdminStore`, `ContentStore`, `CatalogStore`, `AssistantAdminStore`, `SettingsStore`, `UsersStore` | por feature (admin) | lista, filtros, seleção, entidade em edição, dirty state |

Padrões: `withEntities` para listas, `withComputed` para derivados (ex.: chips ativos a partir dos filtros), `rxMethod` com `debounceTime` + `switchMap` para pesquisa, estado de pedido uniforme (`idle | loading | success | error`). A sincronização filtros ↔ URL é feita num único sítio (a store lê `ActivatedRoute` e escreve com `router.navigate` com `queryParamsHandling: 'merge'`).

### 7.4 Padrões Angular obrigatórios

- Componentes standalone, `ChangeDetectionStrategy.OnPush`, aplicação zoneless.
- Signals e `input()`/`output()`/`model()`; novo control flow (`@if`, `@for` com `track`, `@defer` para galeria, mapa e secções abaixo da dobra).
- `inject()` em vez de construtor; sem `NgModule`.
- Rotas lazy com `loadComponent`/`loadChildren`, resolvers funcionais só onde o SSR precisa dos dados.
- HTTP com `provideHttpClient(withFetch(), withInterceptors([...]))`; `withHttpTransferCacheOptions` para não repetir pedidos após hidratação.
- Interceptors funcionais: `apiBaseUrl`, `auth` (admin: anexa token e faz refresh em 401 com fila única), `error` (converte problem+json em mensagens), `loading`.
- Guards funcionais: `authGuard`, `roleGuard(['ADMIN'])`, `unsavedChangesGuard` (`canDeactivate`) nos formulários do admin.
- Formulários reativos tipados; validações do Zod reutilizadas por um adaptador para `ValidatorFn`.
- `NgOptimizedImage` com `srcset` das variantes da API e `priority` na foto hero/capa.
- Meta tags e dados estruturados por página com `Title` e `Meta`, canonical e Open Graph.
- Internacionalização: textos em PT-PT; preparar `@angular/localize` só se houver pedido de EN.

### 7.5 Rotas do admin

`/login`, `/recuperar-password`, `/` (dashboard), `/viaturas`, `/viaturas/nova`, `/viaturas/:id`, `/destaques/:zona`, `/financiamento`, `/financiamento/:id`, `/leads`, `/leads/:id`, `/conteudo/home`, `/conteudo/sobre`, `/conteudo/vantagens`, `/conteudo/testemunhos`, `/conteudo/filtros-rapidos`, `/conteudo/legais`, `/catalogos/:tipo`, `/definicoes`, `/utilizadores`, `/auditoria`. Todas exceto login e recuperação sob `authGuard`; módulos restritos com `roleGuard`.

## 8. Tailwind e design system

Os tokens do design são a única fonte de cores, tipografia, espaçamentos, raios e sombras. Nenhum componente usa valores arbitrários (`bg-[#e11d2a]`); tudo passa por tokens semânticos, o que permite trocar a paleta sem tocar nos componentes.

### 8.1 Tokens

Valores retirados do `Private Motors.html`. O design entrega um `tailwind.config.ts` para Tailwind 3; a implementação usa Tailwind v4 com os mesmos nomes em `@theme` (`libs/shared/ui/styles/theme.css`), o que mantém as classes do design (`bg-ink-950`, `text-red-400`, `rounded-lg`, `shadow-glow`) e resolve a nota do design sobre `font-stretch`, que no v4 já tem utilitário nativo (`font-stretch-125%`). Contrastes medidos sobre ink-950.

```css
@import "tailwindcss";

@theme {
  --color-*: initial;               /* só a paleta da marca */
  --color-white: #FFFFFF;
  --color-transparent: transparent;

  /* Vermelho: red-500 = marca e fundo dos CTA; red-400 = texto e links */
  --color-red-50:  #FFF1F1;  --color-red-100: #FFE0E1;  --color-red-200: #FFC2C4;
  --color-red-300: #FF9599;  --color-red-400: #FF5C62;  --color-red-500: #D0161F;
  --color-red-600: #B0121A;  --color-red-700: #8C0F15;  --color-red-800: #660C11;
  --color-red-900: #3F090C;  --color-red-950: #24060A;

  /* Ink: preto levemente frio, nunca #000 */
  --color-ink-100: #EDEDF0;  --color-ink-200: #D6D6DB;  --color-ink-300: #B4B4BC;
  --color-ink-400: #8E8E98;  --color-ink-500: #6B6B75;  --color-ink-600: #45454E;
  --color-ink-700: #2E2E35;  --color-ink-800: #212126;  --color-ink-850: #18181C;
  --color-ink-900: #111114;  --color-ink-950: #09090B;

  /* Estado: texto sobre fundo tint da mesma família */
  --color-success: #4CD38A;  --color-success-bg: #0D2418;
  --color-warning: #F5B53D;  --color-warning-bg: #2E2410;
  --color-error:   #FF6B6B;  --color-error-bg:   #2A0F10;   /* sempre com ícone e texto */
  --color-info:    #6FA8FF;  --color-info-bg:    #0F1B2E;

  --font-display: "Archivo", system-ui, sans-serif;   /* largura 112–125 % */
  --font-sans:    "Geist", system-ui, sans-serif;

  --text-display-2xl: clamp(2.5rem, 1.6rem + 3.8vw, 5.25rem);
  --text-display-2xl--line-height: 0.96;  --text-display-2xl--letter-spacing: -0.035em;
  --text-display-xl: clamp(2rem, 1.6rem + 1.6vw, 3rem);
  --text-display-xl--line-height: 1;      --text-display-xl--letter-spacing: -0.03em;
  --text-price-xl: clamp(2.75rem, 2.4rem + 1.4vw, 3.5rem);
  --text-price-xl--line-height: 1;        --text-price-xl--letter-spacing: -0.035em;
  --text-h1: clamp(1.75rem, 1.5rem + 1vw, 2.25rem);   --text-h1--line-height: 1.1;
  --text-h2: clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem); --text-h2--line-height: 1.15;
  --text-h3: 1.125rem;                                 --text-h3--line-height: 1.2;

  --radius-sm: 6px;  --radius-md: 10px;  --radius-lg: 16px;  --radius-xl: 20px;

  --shadow-card: inset 0 0 0 1px rgb(237 237 240 / .07);
  --shadow-glow: inset 0 0 0 1px rgb(255 92 98 / .35), 0 24px 48px -24px rgb(208 22 31 / .6);
  --shadow-overlay: 0 -20px 60px rgb(0 0 0 / .6), inset 0 0 0 1px rgb(237 237 240 / .08);

  --breakpoint-sm: 640px;  --breakpoint-md: 768px;  --breakpoint-lg: 1024px;  --breakpoint-xl: 1280px;
  --container-page: 1280px;          /* margem lateral 24px */
  --spacing-touch: 44px;             /* min-h-touch */
}
```

| Token | Especificação (mobile → lg) | Uso no design |
| --- | --- | --- |
| display-2xl | Archivo 125 % · 700 · 40→84 px | Título do hero |
| display-xl | Archivo 125 % · 700 · 32→48 px | Títulos de secção ("Em destaque") |
| price-xl | Archivo 118 % · 700 · 44→56 px · números tabulares | Prestação no simulador |
| h1 / h2 / h3 | Archivo 112 % · 600 · 28→36 / 22→28 / 18 px | Título da viatura, secções, cards |
| body-lg | Geist 400 · 17→19 px / 1.55 · ink-300 | Subtítulo do hero |
| body | Geist 400 · 15 px / 1.6 | Texto corrido |
| label | Geist 500 · 13–14 px | Botões, chips, inputs |
| caption | Geist 400 · 12 px · ink-400 | Meta do card (ano · km · combustível · caixa) |
| overline | Geist 600 · 11 px · +14 % · maiúsculas · red-400 | Sobretítulos ("Conceito") |

Espaçamento: escala Tailwind base 4 px, usada em múltiplos de 2 (4, 8, 12, 16, 20, 24, 32, 48, 64, 96). Ícones: Phosphor (regular e fill), servidos localmente. Fontes Archivo (variável 400–800, largura 62–125 %) e Geist (400, 500, 600) servidas localmente com `font-display: swap` e preload das usadas acima da dobra.

**Estados obrigatórios (do design):** botão primário red-500 → hover red-600 → active red-700, focus com anel red-400 de 2 px, disabled e loading ("A enviar" com ícone a rodar); secundário transparente → hover ink-850 → active ink-800; ghost red-400 → hover #1A0709 → active red-950; chip inativo ink-850 com aresta 10 %, ativo red-950 com texto red-200 e aresta red-500, pendente tracejado; input com aresta 12 %, focus red-400, erro #FF6B6B com ícone. Área de toque mínima de 44 px em todos.

Modo escuro é a experiência principal do site; o admin pode usar uma variante clara com os mesmos tokens semânticos redefinidos em `[data-theme="light"]`.

### 8.2 Componentes base (`libs/shared/ui`)

| Componente | Responsabilidade | Notas |
| --- | --- | --- |
| `<pm-header>` | Logo, navegação, telefone, "Falar connosco"; menu em gaveta abaixo de lg | Dados do `SiteStore` |
| `<pm-smart-search>` | Input em linguagem natural + chips "Entendi:" + atalhos + frases de exemplo; emite `FilterState` | Usa `libs/search-parser` |
| `<pm-mode-switch>` | Procurar por carro / Quanto posso pagar |  |
| `<pm-budget-picker>` | Prestação, entrada e prazo; mostra "cabem" / "ficam perto" |  |
| `<pm-filter-chip>` | Chip removível; variantes active, pending (tracejado), quick |  |
| `<pm-filter-panel>` | Painel inline em lg+, bottom sheet (CDK Overlay) em mobile | 8 filtros |
| `<pm-vehicle-card>` | `variant: default \| featured \| compact`; input `finance` | Badges, favorito, sobra/falta |
| `<pm-finance-inline>` | Gaveta do card: slider de entrada, ticks de prazo, barra capital/juros | Variante 1a |
| `<pm-finance-simulator>` | Simulador completo da página de viatura | `layout: 'sliders' \| 'chart'` (2a / 2b) |
| `<pm-term-ticks>` | Seletor de prazo 24–96 reutilizado em 3 sítios | Prazos vêm do produto |
| `<pm-cost-bar>` | Barra entrada/capital/juros animada | Reutilizada no card e no detalhe |
| `<pm-empty-state>` | Recebe sugestões `{label, count, apply()}` + CTA "Pedimos o carro por si" |  |
| `<pm-assistant>` | FAB + painel lateral 420 px / ecrã inteiro; máquina de estados da conversa | `AssistantStore` |
| `<pm-skeleton-card>` | Placeholder com shimmer enquanto a API responde |  |
| `pm-button`, `pm-input`, `pm-select`, `pm-slider`, `pm-badge`, `pm-bottom-sheet`, `pm-gallery`, `pm-toast` | Base de `libs/shared/ui` | Estados do design; CDK para foco e overlays |
| Admin: `pm-data-table`, `pm-uploader`, `pm-sortable-list`, `pm-rich-text`, `pm-confirm-dialog`, `pm-icon-picker` | Só `scope:admin` |  |

Toda a matemática de financiamento passa por um único ponto (`FinanceService` a envolver `libs/finance`), como pede o design.

Cada componente tem histórias em Storybook com todos os estados (hover, focus, active, disabled, loading) e é testado com Angular Testing Library. Comportamentos acessíveis (foco, teclado, overlays) usam o Angular CDK, com o visual 100% Tailwind.

## 9. Requisitos não funcionais

| Área | Requisito | Como se mede |
| --- | --- | --- |
| Performance | LCP < 2,5 s, INP < 200 ms, CLS < 0,1 em mobile 4G | Lighthouse CI e dados reais (CrUX) |
| Performance | Bundle inicial do site < 200 kB gzip | Budgets no `angular.json` |
| Performance | Pesquisa responde em < 300 ms (p95) com 500 viaturas | Teste de carga (k6) |
| SEO | Páginas públicas renderizadas no servidor, `sitemap.xml` dinâmico, `robots.txt`, canonical, Open Graph, `schema.org/Car` e `AutoDealer` | Search Console, Rich Results Test |
| SEO | URLs amigáveis e estáveis; viatura vendida → 410 ou 301 para listagem do modelo | Testes E2E |
| Acessibilidade | WCAG 2.2 AA: contraste, foco visível, navegação por teclado, labels, `aria-live` nos resultados | axe em CI + revisão manual |
| Segurança | OWASP Top 10: validação server-side, CSP, rate limit, CSRF (SameSite + origin check), dependências auditadas | `npm audit`, Snyk/Dependabot |
| RGPD | Consentimento explícito nos formulários, política de privacidade, retenção de leads 24 meses, anonimização a pedido | Checklist legal |
| Legal (crédito) | Simulações mostram TAEG, MTIC, exemplo representativo e nota de que estão sujeitas a aprovação | Validação com a financeira |
| Fiabilidade | Backups diários da base de dados com retenção de 30 dias e restauro testado | Teste trimestral |
| Observabilidade | Logs estruturados, Sentry no front e na API, uptime monitor | Alertas por email |

### 9.1 Testes

- **Unitários**: `libs/finance` e `libs/search-parser` com cobertura ≥ 95 %; services da API e stores ≥ 80 %.
- **Componentes**: Angular Testing Library para todos os componentes de `shared/ui` e features.
- **Integração API**: Supertest contra PostgreSQL em container (Testcontainers), incluindo permissões por perfil.
- **E2E**: Playwright para os fluxos críticos: pesquisar e filtrar, abrir detalhe e simular, pesquisa por prestação, enviar orçamento com retoma, login admin, criar e publicar viatura com fotos, reordenar destaques, alterar TAN e ver a prestação mudar no site.
- **Contrato**: os tipos do front são gerados/importados de `libs/contracts`, por isso uma quebra de contrato falha a compilação.

### 9.2 CI/CD e ambientes

- GitHub Actions: lint, typecheck, testes, build afetados (`nx affected`), Lighthouse CI e E2E em cada PR.
- Ambientes: `dev` (local com Docker Compose: API, PostgreSQL, MinIO, Mailpit), `staging` e `produção`.
- Deploy: site SSR e API em containers numa VPS com Docker e Coolify; admin servido como estático pelo mesmo Coolify; Cloudflare à frente para DNS, CDN e SSL; migrações Prisma executadas no arranque do deploy.
- Configuração só por variáveis de ambiente, validadas no arranque; segredos fora do repositório.

## 10. Plano de entrega e critérios de aceitação

A ordem abaixo põe primeiro o que desbloqueia tudo o resto (contratos, dados, cálculo) e deixa cada fase demonstrável ao cliente.

1. **Fundações.** Monorepo, CI, Docker Compose, `theme.css` com os tokens do design, `libs/contracts`, `libs/finance` e `libs/search-parser` portados do protótipo com testes (as frases de exemplo do design são casos de teste), schema Prisma e seed com as 20 viaturas do protótipo. Sai quando: o cálculo bate ao cêntimo com o protótipo (TAEG 15 %, sem entrada, 96 meses) e com as simulações da financeira.
2. **API núcleo + auth.** Viaturas, imagens, catálogos, financiamento, pesquisa com facetas, modo orçamento e sugestões do estado vazio, auth e perfis, OpenAPI. Sai quando: todos os endpoints da secção 6 têm testes de integração a passar.
3. **Backoffice de stock.** Login, dashboard, viaturas (formulário completo e fotos), catálogos, financiamento com simulador de teste. Sai quando: o stand consegue carregar 10 viaturas reais sozinho.
4. **Site público — homepage.** Header, footer, pesquisa inteligente, dois modos, painel de filtros, grelha com card 1a, estado vazio, destaques, vantagens, testemunhos, favoritos. Sai quando: o comportamento é igual ao protótipo em mobile e desktop e o Lighthouse mobile é ≥ 90.
5. **Site público — restantes páginas.** Detalhe com simulador 2a/2b, retoma, orçamento, sobre e contactos (após a 2.ª ronda do design). Sai quando: o cliente aprova a revisão visual.
6. **Leads, conteúdo e assistente.** Formulários e CTAs, leads no admin com notificações, destaques, todos os conteúdos da home, assistente guiado e o seu editor, definições, utilizadores e auditoria. Sai quando: nenhum texto ou imagem do site está no código.
7. **Qualidade e lançamento.** E2E completos, acessibilidade, SEO, RGPD e páginas legais, backups, monitorização, formação ao stand, migração de domínio. Sai quando: todos os critérios abaixo estão marcados.
8. **Fase 2 (opcional).** Assistente com linguagem natural por IA (substitui o parser e o motor de regras sem mudar os contratos), comparador de viaturas se não entrar no MVP e integração com o Standvirtual (`externalRef`).

### Critérios de aceitação globais

- [ ] Todos os blocos da tabela da secção 2 são editáveis no backoffice e a alteração aparece no site em menos de 1 minuto.
- [ ] Criar, publicar, reservar e vender uma viatura atualiza listagem, destaques e detalhe sem intervenção técnica.
- [ ] Alterar a TAN no produto padrão muda a prestação em todos os cards, no detalhe e na pesquisa por prestação.
- [ ] A prestação calculada no browser e na API é idêntica para o mesmo input (teste automático).
- [ ] Qualquer pesquisa é reproduzível copiando o URL.
- [ ] Um lead enviado do site aparece no admin com a viatura, a simulação e as fotos de retoma, fica ligado ao contacto certo sem criar duplicados, e gera email ao stand e uma tarefa "Ligar ao cliente" atribuída a um comercial.
- [ ] Um utilizador SALES não consegue aceder a Financiamento (edição), Definições nem Utilizadores, nem pela UI nem pela API.
- [ ] Lighthouse mobile ≥ 90 em performance, acessibilidade, boas práticas e SEO nas páginas públicas.
- [ ] axe sem erros críticos em todas as páginas públicas e do admin.
- [ ] O design implementado corresponde ao `docs/design/Private_Motors.html` em mobile, tablet e desktop (revisão visual aprovada pelo cliente).

### Questões em aberto

- [ ] Qual a financeira parceira e as condições reais (TAN, comissões, prazos, entrada mínima, idade máxima da viatura)? Até lá, o site usa o modo `TAEG_INPUT` a 15 % do protótipo.
- [ ] Card 1a, 1b ou 1c na grelha, e 1c em "Quanto posso pagar?" (secção 2.2)?
- [ ] Simulador 2a, 2b ou 2a com o gráfico de 2b na página de viatura?
- [ ] O comparador de viaturas entra no MVP?
- [ ] A nota Google (4,9 · 312 avaliações) é introduzida à mão no admin ou sincronizada com o Google Business Profile?
- [ ] Morada, telefone e horário definitivos (os do design são provisórios).
- [ ] Fotografias reais do stock e do stand para substituir os placeholders.
- [ ] Quantas viaturas em stock em média e quantos utilizadores de backoffice?
- [ ] Onde fica o alojamento e quem é o dono do domínio e das contas (Cloudflare, SMTP, Sentry)?
