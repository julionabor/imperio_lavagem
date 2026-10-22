# Manual de utilização do backoffice — Private Motors

Este guia é para a equipa do stand. Não é necessário saber programar para usar o backoffice.

---

## Acesso

Abra o browser e vá a `https://privatemotors.pt/admin`
Introduza o seu email e password. Se for a primeira vez, use as credenciais criadas pelo responsável do stand.

**Esqueceu a password?** Clique em "Recuperar password" e siga o email recebido.

---

## 1. Dashboard

A página inicial mostra os indicadores do dia:

- **Viaturas publicadas** — total de viaturas visíveis no site
- **Leads hoje** — pedidos de informação recebidos hoje
- **Visitas** — sessões no site (últimas 24 h)
- **Taxa de conversão** — leads / visitas

Use o dashboard para ter uma visão rápida do estado do stand. Não é necessário fazer nada aqui.

---

## 2. Viaturas

### Criar uma viatura

1. Clique em **Viaturas** no menu lateral.
2. Clique no botão **+ Nova viatura**.
3. Preencha os separadores um a um:

| Separador | O que preencher |
|-----------|-----------------|
| **Básico** | Marca, modelo, versão, ano, quilómetros, combustível, caixa de velocidades |
| **Preço** | Preço de venda, preço anterior (opcional, aparece riscado), IVA dedutível |
| **Detalhe** | Cor, interior, portas, lugares, potência, cilindrada, garantia |
| **Descrição** | Texto livre sobre o estado e histórico da viatura |
| **Equipamento** | Adicione cada item de equipamento com o botão + |
| **Fotos** | Faça upload das fotos (arraste para reordenar; a primeira é a capa) |
| **SEO** | Título e descrição para motores de busca (se deixar vazio, gerado automaticamente) |

4. Use **Guardar rascunho** durante o preenchimento.
5. Quando estiver pronto, clique em **Publicar** — a viatura fica visível no site.

### Editar uma viatura existente

1. Na lista de viaturas, clique na linha da viatura (ou no ícone de lápis).
2. Edite os campos pretendidos.
3. Clique em **Guardar**.

As alterações ficam visíveis no site em menos de 1 minuto.

### Mudar o estado de uma viatura

Na lista de viaturas, na coluna **Estado**, pode clicar para mudar entre:

- **Rascunho** — não visível no site
- **Publicado** — visível no site
- **Reservado** — visível com badge "Reservado" (não aparece nas pesquisas)
- **Vendido** — removido do stock (mantido no historial)

### Eliminar uma viatura

Abra a viatura e use o botão **Eliminar** no topo. Só é possível eliminar rascunhos e viaturas vendidas. Para as outras, mude primeiro o estado para "Vendido".

---

## 3. Destaques

Os destaques são as viaturas que aparecem em destaque na homepage, com maior visibilidade.

1. Clique em **Destaques** no menu.
2. Escolha a zona: **Principal**, **Linha 2**, etc.
3. Use a pesquisa para encontrar a viatura e clique em **Adicionar**.
4. Arraste as viaturas para reordenar dentro de cada zona.
5. Para remover, clique no × ao lado da viatura.

As alterações ficam imediatamente visíveis no site.

---

## 4. Leads e CRM

### Ver os leads recebidos

Clique em **CRM** → **Leads** para ver todos os pedidos de informação.

Cada lead mostra:
- Nome e telemóvel do cliente
- Viatura a que se refere (ou sem viatura, se veio do assistente/orçamento)
- Data e hora de entrada
- Estado atual: Novo, Em contacto, Proposta, Ganho, Perdido

### Pipeline de vendas

Clique em **CRM** → **Pipeline** para ver o quadro kanban.

Arraste o lead pela coluna para avançar no processo:

1. **Novo** — lead acabou de chegar
2. **Em contacto** — já falou com o cliente
3. **Proposta** — enviou proposta ou agendou visita
4. **Ganho** — viatura vendida
5. **Perdido** — cliente não avançou

### Ficha do contacto

Clique num contacto em qualquer lista para abrir a ficha completa, que mostra:
- Histórico de todos os leads e interações
- Tarefas associadas
- Linha do tempo de atividades

### Tarefas

As tarefas são criadas automaticamente quando chega um novo lead (para o vendedor de serviço). Também pode criar manualmente em **CRM** → **Tarefas**.

Marque as tarefas como concluídas quando as executar.

### Relatórios

**CRM** → **Relatórios** mostra uma tabela com vendedores, leads por estado e taxa de conversão do período selecionado.

Para exportar em Excel/CSV, clique no botão **Exportar CSV**.

---

## 5. Conteúdo do site

Clique em **Conteúdo** para editar o texto e imagens do site. Nenhuma alteração requer programador.

### O que pode editar

| Secção | O que muda no site |
|--------|-------------------|
| **Homepage** | Título principal, subtítulo, imagem de fundo |
| **Vantagens** | Os 3-4 pontos de vantagem ("Garantia 12 meses", etc.) |
| **Testemunhos** | Opiniões de clientes com nome e foto |
| **Navegação** | Links do menu principal e do rodapé |
| **Filtros rápidos** | Os chips de atalho abaixo da caixa de pesquisa ("SUV", "Elétrico", etc.) |
| **Frases de pesquisa** | As frases de exemplo que aparecem na caixa de pesquisa |
| **Páginas legais** | Política de privacidade, política de cookies, termos e condições |

### Como editar

1. Selecione a secção no menu lateral.
2. Edite o texto nos campos apresentados.
3. Para os textos longos das páginas legais, use a formatação Markdown:
   - `## Título` — título de secção
   - `**negrito**` — texto a negrito
   - `- item` — lista
4. Clique em **Guardar**.

As alterações ficam visíveis no site imediatamente após guardar.

---

## 6. Assistente guiado

O assistente é o chat flutuante que aparece no canto inferior direito do site.

Clique em **Assistente** no menu para editar:
- **Mensagem de boas-vindas** — o que o assistente diz ao ser aberto
- **Perguntas** — as 3-4 perguntas que guiam o cliente (ex.: "Qual é o seu orçamento mensal?")
- **Respostas** — as opções para cada pergunta

As sugestões do assistente são calculadas automaticamente a partir do catálogo de viaturas.

---

## 7. Catálogos

Clique em **Catálogos** para gerir as marcas, modelos e tipos de equipamento.

### Marcas e modelos

Aqui pode:
- Adicionar uma nova marca (aparece nos filtros e no formulário de viaturas)
- Adicionar modelos a uma marca existente
- Definir sinónimos (ex.: "Golf" → "Volkswagen Golf") para a pesquisa inteligente

### Tipos de equipamento

Gerencie a lista de equipamentos padronizados (ex.: "Ar condicionado", "GPS", "Câmara de marcha atrás").

---

## 8. Financiamento

Clique em **Financiamento** para ver e editar os produtos de financiamento disponíveis.

O produto padrão é o que aparece no simulador do site. Para o editar:

1. Clique no produto.
2. Altere a taxa (TAEG ou TAN), entrada mínima, prazo mínimo e máximo.
3. Clique em **Guardar**.

A prestação em todo o site é recalculada automaticamente.

---

## 9. Definições

Clique em **Definições** para configurar os dados do stand:

- **Empresa** — nome, NIF, morada, contactos, horário de funcionamento
- **Redes sociais** — links para Facebook, Instagram, etc.
- **SEO global** — logo, meta description padrão, Google Analytics ID
- **Notificações** — email(s) para receber alertas de novos leads

---

## 10. Utilizadores

Apenas o perfil **Admin** pode gerir utilizadores. Clique em **Utilizadores** para:

- **Criar utilizador** — introduza nome, email e perfil
- **Perfis disponíveis:**
  - **Admin** — acesso total
  - **Manager** — tudo exceto utilizadores e financiamento (edição)
  - **Sales** — leads, CRM, viaturas (criar e editar, não publicar nem eliminar)
- **Desativar** — o utilizador deixa de conseguir entrar sem ser eliminado

A password temporária é enviada automaticamente para o email do novo utilizador.

---

## 11. Auditoria

Clique em **Auditoria** para ver um registo de todas as ações realizadas no backoffice: quem fez o quê e quando.

Útil para resolver dúvidas ("quem alterou o preço desta viatura?").

---

## Perguntas frequentes

**O site está lento a refletir as alterações.**
As páginas públicas têm cache de 60 segundos. Aguarde 1-2 minutos e force o refresh no browser (Ctrl+F5).

**Não consigo fazer upload de fotos.**
As fotos são redimensionadas automaticamente para o site. Formatos aceites: JPEG, PNG, WebP. Tamanho máximo por foto: 20 MB. Se continuar com problemas, tente um browser diferente.

**Um lead aparece duplicado.**
O sistema agrupa leads pelo telemóvel do cliente. Se o mesmo telemóvel enviar dois pedidos, aparecem como dois leads do mesmo contacto. Abra o contacto e veja a linha do tempo.

**Como apagar dados de um cliente (RGPD)?**
Na ficha do contacto, use o botão **Anonimizar**. O nome, email e telemóvel são substituídos por identificadores anónimos. O historial de atividade comercial é mantido para fins de auditoria.

**Preciso de ajuda técnica.**
Contacte o administrador do sistema ou abra um pedido de suporte.

---

*Versão do manual: 2026-10-22 · Private Motors v1.0*
