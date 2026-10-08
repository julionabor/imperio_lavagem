# Guia de Deploy — Railway

Este guia acompanha-o passo a passo desde zero até ter o site e a API online no Railway. Demore o tempo que precisar em cada passo — cada um é independente e pode ser verificado antes de avançar.

**Tempo estimado (primeira vez):** 30–45 minutos.

---

## Pré-requisitos

Antes de começar, confirme que tem:

- [ ] Conta no GitHub com o repositório `private-motors` empurrado para `main`
- [ ] O CI do GitHub Actions a passar (o Railway só faz deploy após o CI)
- [ ] Conta no Railway: crie em [railway.app](https://railway.app) (plano gratuito suficiente para começar)

---

## Parte 1 — Criar o projeto no Railway

### 1.1 Novo projeto

1. Entre em [railway.app/dashboard](https://railway.app/dashboard)
2. Clique em **New Project**
3. Escolha **Deploy from GitHub repo**
4. Autorize o Railway a aceder ao GitHub se for pedido
5. Selecione o repositório `private-motors`
6. Clique em **Add Variables** quando aparecer — **não** clique em Deploy ainda

> O Railway vai mostrar um painel vazio com um serviço. Ignore por agora.

---

## Parte 2 — Criar a base de dados PostgreSQL

### 2.1 Adicionar o plugin PostgreSQL

1. No painel do projeto, clique em **+ New**
2. Escolha **Database → Add PostgreSQL**
3. O Railway cria automaticamente um serviço PostgreSQL e define a variável `DATABASE_URL`

### 2.2 Guardar a DATABASE_URL

1. Clique no serviço **Postgres** que acabou de criar
2. Vá ao separador **Variables**
3. Copie o valor de `DATABASE_URL` — vai precisar dele no passo 3.3

---

## Parte 3 — Serviço da API

### 3.1 Criar o serviço

1. No painel do projeto, clique em **+ New → GitHub Repo**
2. Selecione o mesmo repositório `private-motors`
3. Quando o Railway perguntar "How do you want to deploy this?", aguarde — não clique em Deploy ainda

### 3.2 Configurar o root directory e os comandos

1. Clique no novo serviço e vá ao separador **Settings**
2. Em **Source → Root Directory**, escreva: `apps/api`
   > Isto diz ao Railway que a API vive nesta pasta. O `railway.json` dentro dela define os comandos de build e arranque automaticamente.
3. Em **Networking → Internal Networking**, anote o nome interno do serviço (ex.: `api.railway.internal`) — vai precisar mais tarde

### 3.3 Definir as variáveis de ambiente

1. Vá ao separador **Variables**
2. Clique em **+ New Variable** e adicione cada uma das seguintes:

| Variável | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | (cole o valor copiado no passo 2.2) |
| `JWT_SECRET` | Gere uma string aleatória de ≥ 32 caracteres. Pode usar: `openssl rand -hex 32` no terminal |
| `JWT_REFRESH_SECRET` | Gere outra string aleatória diferente da anterior |
| `WEB_URL` | `https://SEU-DOMINIO.pt` (por agora pode pôr `https://privatemotors.up.railway.app`) |
| `UPLOAD_DIR` | `/data/uploads` |
| `EMAIL_TRANSPORT` | `console` (por agora; mude para o SMTP do Brevo quando tiver a conta) |
| `EMAIL_FROM` | `"Private Motors" <noreply@privatemotors.pt>` |

> **Nunca ponha estes valores no Git.** O Railway guarda-os cifrados.

### 3.4 Criar o volume para imagens

1. No separador **Settings**, procure **Volumes**
2. Clique em **+ Add Volume**
3. Em **Mount Path**, escreva: `/data/uploads`
4. Clique em **Create**

> O volume persiste entre deploys. As imagens carregadas para o site ficam aqui.

### 3.5 Configurar os Watch Paths (opcional mas recomendado)

Sem watch paths, qualquer commit despoleta o rebuild de ambos os serviços. Com watch paths, só o serviço afetado reconstrói.

1. Em **Settings → Watch Paths**, adicione:
   ```
   apps/api/**
   libs/**
   pnpm-workspace.yaml
   ```

---

## Parte 4 — Serviço do site Angular

### 4.1 Criar o serviço

1. No painel do projeto, clique em **+ New → GitHub Repo**
2. Selecione o mesmo repositório `private-motors`

### 4.2 Configurar o root directory

1. Vá ao separador **Settings**
2. Em **Source → Root Directory**, escreva: `apps/web`
   > O `railway.json` dentro desta pasta define os comandos de build e arranque.

### 4.3 Definir as variáveis de ambiente

1. Vá ao separador **Variables**
2. Adicione apenas:

| Variável | Valor |
|---|---|
| `NODE_ENV` | `production` |

> O site Angular SSR não precisa de mais variáveis: todos os dados vêm da API em runtime.

### 4.4 Configurar os Watch Paths

1. Em **Settings → Watch Paths**, adicione:
   ```
   apps/web/**
   libs/**
   pnpm-workspace.yaml
   ```

---

## Parte 5 — Ativar o deploy automático com "Wait for CI"

Este passo garante que o Railway só faz deploy se o CI do GitHub passar — evita colocar código partido em produção.

### 5.1 Ligar o CI (por serviço)

Repita os passos seguintes para o serviço **api** e depois para o serviço **web**:

1. Clique no serviço
2. Vá a **Settings → Deploy**
3. Em **GitHub Actions Checks**, ative **Wait for CI checks**
4. Selecione o workflow `CI` na lista

### 5.2 Verificar a configuração

Depois de ativar, o Railway mostrará um ícone de relógio nos próximos deploys enquanto aguarda o CI.

---

## Parte 6 — Primeiro deploy

### 6.1 Despoleta o deploy

Faça um pequeno commit no repositório para despoleta o pipeline completo:

```bash
git commit --allow-empty -m "chore: primeiro deploy Railway"
git push origin main
```

### 6.2 Acompanhe o progresso

1. No painel do Railway, veja os dois serviços a construir
2. O build da API demora ~2–3 minutos (compila TypeScript e instala dependências)
3. O build do site demora ~3–5 minutos (build Angular com SSR)

Em caso de erro, clique no serviço → separador **Deploy Logs** para ver o erro completo.

### 6.3 Verificar que está online

Após o deploy completar:

1. Clique no serviço **api** → separador **Settings** → **Networking → Public Networking**
2. Clique em **Generate Domain** para obter um URL público (ex.: `api-xxx.up.railway.app`)
3. Abra no browser: `https://api-xxx.up.railway.app/health`
4. Deve ver: `{"status":"ok","env":"production"}`

Repita para o serviço **web** e confirme que vê a página "Em construção".

---

## Parte 7 — Correr o seed (dados iniciais)

Após o primeiro deploy da API:

1. Clique no serviço **api**
2. Vá ao separador **Settings → Deploy → Run Command**
3. Ou use o Railway CLI:

```bash
# Instalar o Railway CLI (uma vez)
npm install -g @railway/cli

# Login
railway login

# Correr o seed
railway run --service api pnpm run seed
```

> O seed cria: 1 utilizador admin, 1 produto de financiamento (TAEG 15%), 20 viaturas de exemplo e os conteúdos da homepage.

---

## Parte 8 — Configurar domínios personalizados

Quando tiver o domínio `privatemotors.pt`:

### API
1. Serviço **api** → **Settings → Networking → Custom Domains**
2. Adicione: `api.privatemotors.pt`
3. No painel DNS da Cloudflare (ou do seu registar), adicione um registo CNAME:
   - Nome: `api`
   - Destino: o domínio Railway que o painel mostra

### Site
1. Serviço **web** → **Settings → Networking → Custom Domains**
2. Adicione: `privatemotors.pt` e `www.privatemotors.pt`
3. No painel DNS, adicione os registos CNAME indicados pelo Railway

> O Railway gere o certificado SSL (HTTPS) automaticamente — não precisa de fazer nada.

### Atualizar WEB_URL na API

Depois de ter o domínio definitivo, atualize a variável `WEB_URL` no serviço **api** para `https://privatemotors.pt`.

---

## Rollback

Se um deploy correr mal:

1. Clique no serviço problemático
2. Vá ao separador **Deployments**
3. Encontre o último deploy que funcionou
4. Clique nos três pontos (...) → **Rollback to this deploy**

O rollback é instantâneo — o serviço anterior volta a responder em segundos.

---

## Referência rápida de variáveis de ambiente

### Serviço `api`

| Variável | Obrigatório | Exemplo / Notas |
|---|---|---|
| `NODE_ENV` | Sim | `production` |
| `DATABASE_URL` | Sim | Gerado pelo plugin PostgreSQL do Railway |
| `JWT_SECRET` | Sim | String aleatória ≥ 32 chars (`openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | Sim | String aleatória diferente da anterior |
| `WEB_URL` | Sim | URL pública do site (para CORS) |
| `UPLOAD_DIR` | Sim | `/data/uploads` (coincide com o mount path do volume) |
| `EMAIL_TRANSPORT` | Sim | `console` em dev; URL SMTP em produção |
| `EMAIL_FROM` | Não | `"Private Motors" <noreply@privatemotors.pt>` |
| `PORT` | Não | Railway define automaticamente |
| `HOST` | Não | `0.0.0.0` (padrão) |

### Serviço `web`

| Variável | Obrigatório | Exemplo / Notas |
|---|---|---|
| `NODE_ENV` | Sim | `production` |
| `PORT` | Não | Railway define automaticamente |

---

## Diagnóstico de problemas comuns

**Build falha com "pnpm: command not found"**
→ O nixpacks detecta `pnpm-workspace.yaml` e instala o pnpm automaticamente. Se falhar, verifique se o `pnpm-workspace.yaml` está na raiz do repositório.

**API arranca mas `/health` devolve 500**
→ Verifique os logs do serviço. Provavelmente uma variável de ambiente em falta (ex.: `JWT_SECRET` com menos de 32 caracteres).

**Migrações Prisma falham no arranque**
→ Verifique se `DATABASE_URL` está corretamente definida. O arranque corre `prisma migrate deploy` antes de iniciar o servidor.

**O site mostra erro 500**
→ Verifique os logs do serviço **web**. Normalmente é o servidor SSR que não consegue iniciar.

**"Wait for CI" — o deploy fica bloqueado**
→ Vá ao GitHub → Actions e verifique se o CI está a passar. Se o CI falhar, o Railway não faz deploy.
