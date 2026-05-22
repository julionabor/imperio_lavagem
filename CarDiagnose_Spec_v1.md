# CarDiagnose — Especificação Técnica Completa
**Império da Lavagem Auto · São João da Madeira**
*Versão 1.1 — Maio 2025*

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitectura do Sistema](#2-arquitectura-do-sistema)
3. [Especificação Detalhada por Step](#3-especificação-detalhada-por-step)
4. [Motor de Recomendação](#4-motor-de-recomendação--árvore-de-decisão)
5. [Ecrã de Resultado e CTA](#5-ecrã-de-resultado-e-cta)
6. [Design Visual](#6-design-visual)
7. [Implementação Técnica](#7-implementação-técnica)
8. [Requisitos do Sistema](#8-requisitos-do-sistema)
9. [Plano de Desenvolvimento](#9-plano-de-desenvolvimento)
10. [Métricas e Roadmap](#10-métricas-e-roadmap)

---

## 1. Visão Geral

### 1.1 O Problema que Resolve

A maioria dos clientes que chega a um estúdio de detailing não sabe exactamente de que serviço precisa. Comparam preços sem entender o que estão a comprar, escolhem o pack mais barato por instinto, ou chegam com expectativas desajustadas à condição real do veículo.

O resultado: taxa de upsell baixa, cancelamentos pós-marcação, e clientes insatisfeitos — não porque o serviço foi mau, mas porque a escolha foi errada desde o início.

### 1.2 A Solução — CarDiagnose

O **CarDiagnose** é um widget interativo de 5 passos, embebido no site do Império da Lavagem, que guia o cliente desde a identificação do seu veículo até à recomendação do pack ideal — com base nas suas dores reais, não nos preços.

O widget funciona como um consultor silencioso: faz as perguntas certas, visualiza o carro do cliente em tempo real, e apresenta uma recomendação personalizada com justificação técnica e CTA directo para marcação.

### 1.3 Objectivos de Negócio

- Canalizar a maioria dos leads para os três packs estratégicos: **Pack Diamante**, **Higienização Premium** e **Higienização Standard**
- Aumentar o ticket médio por cliente através de recomendações orientadas à dor real
- Reduzir o tempo de atendimento e triagem (menos WhatsApp a explicar diferenças entre packs)
- Aumentar a taxa de conversão no site (visitante → marcação)
- Criar uma experiência de marca diferenciadora — nenhum concorrente local tem algo semelhante
- Qualificar o lead antes da marcação: o cliente chega comprometido com o pack recomendado

### 1.4 Hierarquia Comercial dos Packs

O motor de recomendação é desenhado com uma **hierarquia comercial intencional**. A lógica de pontuação favorece os três packs principais em ~75% dos cenários; os packs secundários aparecem apenas quando a situação do cliente é genuinamente melhor servida por eles.

| Tier | Pack | Posição |
|------|------|---------|
| 🥇 Principal | Pack Diamante (300–400 €) | Recomendação prioritária em dores de protecção, riscos e renovação |
| 🥇 Principal | Higienização Premium (100 €) | Recomendação prioritária em dores de interior, odor e casos mistos |
| 🥇 Principal | Higienização Standard (40 €) | Recomendação prioritária em dores de exterior leve e entrada de funil |
| 🥈 Secundário | Pack Brilho & Proteção 1 ano, Pack Zero Km, Polimento | Aparecem quando score e dor não justificam o tier principal |
| 🥉 Residual | Lavagem Básica, Serviços isolados | Só recomendados em scores muito baixos ou dores muito específicas |

### 1.5 Princípio de Design Central

> **Dor primeiro, carro depois.**

O questionário começa pela identificação do problema do cliente antes de pedir dados do veículo. Isto aumenta o engagement e a relevância percebida da recomendação. O modelo 3D serve como elemento emocional de ligação ao veículo — aparece quando o cliente já está envolvido.

---

## 2. Arquitectura do Sistema

### 2.1 Diagrama de Fluxo — 5 Steps

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1          STEP 2         STEP 3        STEP 4        STEP 5  │
│  Dor Principal → Tipo Veículo → Cor / 3D → Questionário → Resultado │
└─────────────────────────────────────────────────────────────┘
```

| Step | Nome | Input do Utilizador | Output Gerado |
|------|------|---------------------|---------------|
| 1 | Dor Principal | Selecção de categoria de problema | Filtro primário + banco de perguntas activado |
| 2 | Tipo de Veículo | Categoria (citadino, SUV, mota…) | Modelo 3D carregado + taxa de SUV calculada |
| 3 | Personalização Visual | Cor da carroçaria + marca/modelo (opcional) | Modelo 3D colorido em tempo real |
| 4 | Diagnóstico | 4–6 perguntas adaptadas à dor do Step 1 | Score de severidade calculado |
| 5 | Recomendação | — (leitura) | Pack recomendado + CTA marcação |

### 2.2 Stack Tecnológico

| Componente | Tecnologia | Justificação |
|------------|------------|--------------|
| Interface / UI | HTML5 + CSS3 + JavaScript ES6+ | Zero dependências pesadas, compatível com qualquer hosting |
| Render 3D | `<model-viewer>` (Google) ou Three.js | model-viewer: simples, leve; Three.js: cores dinâmicas exactas |
| Modelos 3D | Ficheiros `.glb` (6 categorias) | Um modelo representativo por categoria; cor aplicada dinamicamente |
| Dados de veículos | Car Query API (gratuita) | Lista marcas/modelos/anos; apenas para registo, não para render |
| Lógica de recomendação | Árvore de decisão em JS puro | Sem backend; corre 100% no browser |
| Animações | CSS Transitions + Keyframes | Transições entre steps, progress bar, microinteracções |
| Integração marcação | Link directo BUK.pt | CTA final abre marcação online em nova aba |

---

## 3. Especificação Detalhada por Step

### Step 1 — Dor Principal

**Objectivo:** Identificar a categoria de problema que mais preocupa o cliente. Esta escolha activa o banco de perguntas do Step 4 e orienta a recomendação para os packs principais.

#### Layout
- Título: *"O que te preocupa mais no teu carro?"*
- 6 cartões visuais grandes em grelha 2×3 (desktop) / scroll vertical (mobile)
- Cada cartão: ícone SVG + título curto + frase descritiva de 1 linha
- Selecção com highlight dourado; botão "Seguinte" só activa após selecção

#### As 6 Categorias de Dor

| # | ID | Título | Frase descritiva | Pack principal activado |
|---|----|---------|--------------------|--------------------------|
| 1 | `exterior` | Exterior sujo ou opaco | "O brilho desapareceu e a pintura parece baça." | Higienização Standard |
| 2 | `interior` | Interior em mau estado | "Sujidade, manchas, pó acumulado nos plásticos." | Higienização Premium |
| 3 | `odor` | Mau cheiro persistente | "O carro cheira a tabaco, animais ou mofo." | Higienização Premium |
| 4 | `riscos` | Riscos e marcas na pintura | "Micro-riscos, marcas de escovas ou impactos leves." | Pack Diamante |
| 5 | `protecao` | Quero proteger a pintura | "O carro está bem mas quero mantê-lo assim por mais tempo." | Pack Diamante |
| 6 | `completo` | Renovação completa | "Quero o carro como novo — interior e exterior." | Pack Diamante Plus / Exclusive |

---

### Step 2 — Tipo de Veículo

**Objectivo:** Determinar a categoria do veículo para carregar o modelo 3D e calcular taxa adicional quando aplicável.

#### Layout
- Título: *"Qual é o tipo do teu carro?"*
- 6 opções com silhueta SVG por categoria
- Ao clicar, modelo 3D aparece no painel lateral (desktop) ou abaixo (mobile)
- Campo de texto opcional: "Marca e modelo (ex: Peugeot 208)"

#### Categorias e Mapeamento

| # | ID | Label | Modelo 3D | Taxa extra |
|---|----|----|-----------|------------|
| 1 | `citadino` | Citadino / Hatch | `model_citadino.glb` | Sem taxa |
| 2 | `berlina` | Berlina / Sedan | `model_berlina.glb` | Sem taxa |
| 3 | `suv` | SUV / 4×4 | `model_suv.glb` | +2,50 € |
| 4 | `carrinha` | Carrinha / Break | `model_carrinha.glb` | +2,50 € |
| 5 | `monovolume` | Monovolume / 7 Lug. | `model_monovolume.glb` | +2,50 € |
| 6 | `mota` | Mota | `model_mota.glb` | Tabela própria |

---

### Step 3 — Personalização Visual

**Objectivo:** Aplicar a cor do veículo ao modelo 3D em tempo real — o momento de ligação emocional com o próprio carro.

#### Layout
- Título: *"Qual é a cor do teu carro?"*
- Palete de 12 cores pré-definidas + opção "Outra" com colour picker nativo (`input type="color"`)
- Modelo 3D actualiza a carroçaria imediatamente após selecção
- Legenda dinâmica: *"O teu SUV em Azul Escuro"*

#### Cores Pré-definidas

| Label | Hex | Label | Hex | Label | Hex |
|-------|-----|-------|-----|-------|-----|
| Branco | `#F5F5F5` | Preto | `#1A1A1A` | Cinzento | `#8A8A8A` |
| Prateado | `#C0C0C0` | Azul Escuro | `#1B3A6B` | Azul Claro | `#5B8DB8` |
| Vermelho | `#C0392B` | Verde | `#27AE60` | Bege / Champagne | `#D4B896` |
| Laranja | `#E67E22` | Amarelo | `#F1C40F` | Outra | picker |

---

### Step 4 — Questionário de Diagnóstico

**Objectivo:** Aprofundar o diagnóstico com 4 a 6 perguntas adaptadas à dor do Step 1. As respostas alimentam um score que determina a severidade e selecciona o pack ideal.

#### Mecânica de Pontuação
- Cada pergunta tem 3 opções com pontuação: **A = 1 pt · B = 2 pts · C = 3 pts**
- Score total = soma de todos os pontos do Step 4
- A pontuação é mapeada para packs conforme a tabela da Secção 4
- Perguntas exibidas uma de cada vez com barra de progresso no topo

---

#### Banco de Perguntas por Categoria

##### Categoria: EXTERIOR (`dor_id = exterior`)

| # | Pergunta | A (1 pt) | B (2 pts) | C (3 pts) |
|---|----------|----------|-----------|-----------|
| E1 | Quando foi a última vez que o teu carro foi lavado a sério? | Há menos de 2 semanas | Há 1 a 3 meses | Há mais de 3 meses |
| E2 | O teu carro fica estacionado ao ar livre habitualmente? | Não, garagem | Às vezes ao ar livre | Sempre ao ar livre |
| E3 | Há marcas de pássaros, resina de árvore ou pólen na carroçaria? | Raramente | Às vezes | Com frequência |
| E4 | Os plásticos exteriores estão branqueados ou opacos? | Estão em bom estado | Ligeiramente opacos | Muito degradados |

##### Categoria: INTERIOR (`dor_id = interior`)

| # | Pergunta | A (1 pt) | B (2 pts) | C (3 pts) |
|---|----------|----------|-----------|-----------|
| I1 | Tens animais de estimação que andam no carro? | Não | Às vezes | Sempre |
| I2 | Os estofos têm manchas visíveis? | Não há manchas | 1 a 2 manchas leves | Manchas múltiplas / difíceis |
| I3 | Os plásticos e o tablier têm pó acumulado? | Limpos | Algum pó | Muito sujos / gordurosos |
| I4 | A alcatifa tem sujidade incrustada? | Limpa | Suja mas não incrustada | Incrustada / difícil de remover |

##### Categoria: ODOR (`dor_id = odor`)

| # | Pergunta | A (1 pt) | B (2 pts) | C (3 pts) |
|---|----------|----------|-----------|-----------|
| O1 | Qual é a origem provável do cheiro? | Não sei / geral | Tabaco / animais | Mofo / humidade / orgânico |
| O2 | O cheiro persiste depois de abrir as janelas? | Dissipa-se rapidamente | Fica parcialmente | Não desaparece |
| O3 | Já limpaste o interior recentemente? | Limpei há pouco tempo | Há alguns meses | Nunca fiz limpeza profunda |

##### Categoria: RISCOS NA PINTURA (`dor_id = riscos`)

| # | Pergunta | A (1 pt) | B (2 pts) | C (3 pts) |
|---|----------|----------|-----------|-----------|
| R1 | Os riscos são visíveis ao sol ou só com ângulo específico? | Só com ângulo específico | Visíveis ao sol | Visíveis de qualquer ângulo |
| R2 | A pintura tem marcas de escovas de lavagem ou areia? | Não | Poucas marcas | Muitas / severas |
| R3 | Qual é a idade aproximada do carro? | Menos de 2 anos | 2 a 5 anos | Mais de 5 anos |
| R4 | O carro já teve polimento profissional antes? | Sim, recentemente | Sim, mas há muito | Nunca |

##### Categoria: PROTECÇÃO (`dor_id = protecao`)

| # | Pergunta | A (1 pt) | B (2 pts) | C (3 pts) |
|---|----------|----------|-----------|-----------|
| P1 | Quanto tempo queres que a protecção dure? | Alguns meses | 1 ano | 2 anos ou mais |
| P2 | O carro fica exposto a chuva ácida, pólen ou sal marinho? | Raramente | Ocasionalmente | Com frequência |
| P3 | Pretendes vender o carro nos próximos 2 anos? | Não | Talvez | Sim, quero preservar o valor |

##### Categoria: RENOVAÇÃO COMPLETA (`dor_id = completo`)

| # | Pergunta | A (1 pt) | B (2 pts) | C (3 pts) |
|---|----------|----------|-----------|-----------|
| C1 | O interior e o exterior estão ambos em mau estado? | Exterior apenas | Interior apenas | Ambos precisam de atenção |
| C2 | Queres incluir protecção duradoura após a renovação? | Não é prioridade | Se não encarecer muito | Sim, quero protecção máxima |
| C3 | Há quanto tempo não fazes uma limpeza profunda? | Menos de 6 meses | 6 meses a 1 ano | Mais de 1 ano |

---

## 4. Motor de Recomendação — Árvore de Decisão

A lógica combina a **categoria de dor (Step 1)** com o **score total (Step 4)** para seleccionar o pack. Os três packs principais (Diamante, Higienização Premium, Higienização Standard) têm **janelas de score alargadas** para que cubram a maioria dos resultados. Os packs secundários só aparecem quando o score é claramente baixo demais para justificar o principal.

> **Regra de ouro:** Em caso de dúvida entre dois packs, o motor sobe para o pack principal mais próximo — nunca desce.

### 4.1 Tabela de Recomendação Completa

#### Dor: EXTERIOR

| Score | Pack Recomendado | Preço | Tier | Justificação exibida |
|-------|-----------------|-------|------|----------------------|
| 4–5 | **Higienização Standard** 🥇 | 40 € | Principal | "Sujidade acumulada — o Standard faz uma descontaminação completa e devolve o carro em condições." |
| 6–8 | **Higienização Standard** 🥇 | 40 € | Principal | "Exposição regular ao exterior e plásticos a degradar — o Standard com descontaminação férrea é o tratamento certo." |
| 9–10 | **Higienização Premium** 🥇 | 100 € | Principal | "Com o nível de exposição e degradação exterior que descreveste, o Premium protege também os plásticos por até 60 dias." |
| 11–12 | **Higienização Premium** 🥇 | 100 € | Principal | "Situação severa de exterior — o Premium cobre descontaminação, protecção de plásticos e desinfeção total." |

> **Pack alternativo para exterior score 4–5:** Lavagem Básica (25 €) — referida apenas como "opção mais simples, se precisares de algo rápido".

---

#### Dor: INTERIOR

| Score | Pack Recomendado | Preço | Tier | Justificação exibida |
|-------|-----------------|-------|------|----------------------|
| 4–6 | **Higienização Standard** 🥇 | 40 € | Principal | "Aspiração profunda, plásticos e tapetes — o Standard resolve o interior em condições." |
| 7–9 | **Higienização Premium** 🥇 | 100 € | Principal | "Com manchas nos estofos e sujidade incrustada, o Premium lava os estofos e faz desinfeção por ozono." |
| 10–12 | **Higienização Premium** 🥇 | 100 € | Principal | "Interior em estado avançado de sujidade — o Premium é a única opção que cobre estofos, alcatifa, ozono e todos os plásticos." |

> **Pack alternativo para interior score 4–6:** Higienização Apenas Interior (30 €).

---

#### Dor: ODOR

| Score | Pack Recomendado | Preço | Tier | Justificação exibida |
|-------|-----------------|-------|------|----------------------|
| 3–4 | **Higienização Standard** 🥇 | 40 € | Principal | "O Standard inclui tratamento de ozono — suficiente para odores leves e recentes." |
| 5–9 | **Higienização Premium** 🥇 | 100 € | Principal | "Cheiro persistente de tabaco, animais ou mofo precisa do ozono premium do Pack Higienização Premium — elimina na fonte, não mascara." |

> **Pack alternativo para odor score 3–4:** Tratamento Ozono isolado (20 €) — mencionado como "opção pontual se o resto do interior estiver em bom estado".

---

#### Dor: RISCOS NA PINTURA

| Score | Pack Recomendado | Preço | Tier | Justificação exibida |
|-------|-----------------|-------|------|----------------------|
| 4–6 | **Pack Brilho & Proteção 1 ano** 🥈 | 240–270 € | Secundário | "Riscos leves — polimento + vitrificação 1 ano devolve o brilho e protege a pintura por 12 meses." |
| 7–9 | **Pack Diamante** 🥇 | 300–330 € | Principal | "Com riscos visíveis ao sol e histórico sem polimento, a nano-cerâmica 2 anos do Diamante é o tratamento certo para restaurar e proteger." |
| 10–12 | **Pack Diamante** 🥇 | 300–330 € | Principal | "Pintura com danos severos e sem protecção prévia — só o Pack Diamante com nano-cerâmica profissional consegue este nível de restauro e durabilidade." |

> **Pack alternativo para riscos score 4–6:** Polimento isolado (140–160 €).

---

#### Dor: PROTECÇÃO

| Score | Pack Recomendado | Preço | Tier | Justificação exibida |
|-------|-----------------|-------|------|----------------------|
| 3–5 | **Pack Brilho & Proteção 1 ano** 🥈 | 240–270 € | Secundário | "Protecção de 1 ano — ideal para o dia-a-dia com manutenção regular." |
| 6–9 | **Pack Diamante** 🥇 | 300–330 € | Principal | "Exposição frequente a agressões ambientais e intenção de valorizar o carro pedem a nano-cerâmica 2 anos do Diamante." |
| 10+ | **Pack Diamante** 🥇 | 300–330 € | Principal | "Para quem quer o máximo de protecção e preservação do valor, o Pack Diamante é a única escolha." |

> **Pack alternativo para protecção score 3–5:** Vitrificação 1 ano isolada (160 €).

---

#### Dor: RENOVAÇÃO COMPLETA

| Score | Pack Recomendado | Preço | Tier | Justificação exibida |
|-------|-----------------|-------|------|----------------------|
| 3–5 | **Higienização Premium** 🥇 | 100 € | Principal | "Para uma renovação completa a começar pelo interior, o Premium cobre tudo — estofos, plásticos, ozono." |
| 6–7 | **Pack Diamante Plus** 🥇 | 360 € | Principal (variante) | "Interior + exterior + protecção 2 anos: o Diamante Plus inclui polimento, nano-cerâmica e Higienização Premium." |
| 8–9 | **Pack Diamante Exclusive** 🥇 | 400 € | Principal (top) | "A renovação total que o teu carro merece: nano-cerâmica 2 anos + Pack Zero Km incluído." |
| 10+ | **Pack Diamante Exclusive** 🥇 | 400 € | Principal (top) | "Estado avançado de degradação interior e exterior — o Diamante Exclusive é o único pack que trata tudo de uma vez." |

> **Pack alternativo para renovação score 3–5:** Pack Zero Km (130 €).

---

### 4.2 Regras de Ajuste Automático

```
SE vehicleType ∈ {suv, carrinha, monovolume}  →  preçoFinal += 2,50 €
SE vehicleType = mota                          →  ignorar árvore; usar tabela de motas
SE preçoFinal >= 100 €                         →  mostrar opção de parcelamento 4× sem juros
SE dor = completo E score >= 6                 →  sugerir Diamante Exclusive como "opção premium"
SEMPRE                                         →  exibir 1 pack alternativo (tier imediatamente abaixo)
```

### 4.3 Tabela de Motas (fluxo separado)

| Tipo | Pack | Preço |
|------|------|-------|
| Mota até 125 cc | Lavagem Completa Mota | 25 € |
| Mota acima de 125 cc | Lavagem Completa Mota | 30 € |

*Inclui: pré-lavagem, jantes, pneus, carenagens, motor, plásticos, estofos, cera + WD na corrente.*

---

## 5. Ecrã de Resultado e CTA

### 5.1 Estrutura do Ecrã

| Zona | Elemento | Conteúdo / Detalhe |
|------|----------|--------------------|
| A | Cabeçalho personalizado | *"Com base nas tuas respostas, o pack ideal para o teu [Tipo] é:"* |
| B | Card do Pack Principal | Nome + preço em destaque + badge de tier + lista de 3–5 itens incluídos + frase de justificação personalizada |
| C | Parcelamento (se ≥ 100 €) | *"Disponível em 4× de X€ sem juros — solicita na marcação."* |
| D | CTA principal | Botão: **"Marcar agora — [Nome do Pack]"** → `buk.pt/imperiodalavagemauto` em nova aba |
| E | Pack alternativo | Card menor: *"Se preferires uma opção mais simples: [Pack X — preço]"* + botão secundário |
| F | Contacto directo | *"Tens dúvidas? Liga: 96 44 550 06 ou envia DM no Instagram."* |
| G | Reiniciar | Link subtil: *"Recomeçar o diagnóstico"* — sem recarregar a página |

### 5.2 Frases de Justificação — Exemplos

> *"O teu SUV cinzento fica sempre ao ar livre e os plásticos exteriores já estão degradados. O Pack Higienização Standard com descontaminação férrea vai remover o que a chuva e o pólen acumularam — e os plásticos ficam tratados por mais 60 dias."*

> *"Com riscos visíveis ao sol e sem polimento profissional anterior, a pintura precisa de restauro real. O Pack Diamante aplica nano-cerâmica profissional com durabilidade de 2 anos — sem riscos leves, sem manchas ambientais."*

> *"Um cheiro que não sai com a janela aberta é contaminação bacteriana. O ozono premium do Pack Higienização Premium elimina-o na fonte — não mascara, erradica."*

### 5.3 Badge Visual por Tier

Os packs principais devem ter um indicador visual distinto:

```
🏆 RECOMENDAÇÃO PRINCIPAL    → badge dourado + border dourada
⭐ OPÇÃO ALTERNATIVA          → badge cinzento + border subtil
```

---

## 6. Design Visual

### 6.1 Tokens de Design

```css
:root {
  /* Cores */
  --cor-primaria:    #0C1C33;  /* Azul-noite — fundo, headers, botões */
  --cor-destaque:    #F2CC47;  /* Dourado — CTAs, badges, bordas activas */
  --cor-apoio:       #C9CFD8;  /* Cinza claro — divisores, texto secundário */
  --cor-superficie:  #F4F5F7;  /* Fundo de cards */
  --cor-texto:       #1A2535;  /* Texto principal */

  /* Tipografia */
  --fonte-display:   'Montserrat', sans-serif;  /* Títulos de steps */
  --fonte-corpo:     'Outfit', sans-serif;      /* Corpo e interface */

  /* Dimensões */
  --raio-borda:      12px;
  --sombra-card:     0 4px 24px rgba(12, 28, 51, 0.12);
  --transicao:       300ms ease-in-out;
}
```

### 6.2 Layout Responsivo

| Breakpoint | Largura | Layout do widget | Modelo 3D |
|------------|---------|-----------------|-----------|
| Desktop | > 1024px | Formulário esquerda (55%) + 3D direita (45%) | Sempre visível |
| Tablet | 768–1024px | Modelo 3D topo (40% altura) + formulário abaixo | Visível, tamanho reduzido |
| Mobile | < 768px | Full-width sequencial | Aparece após selecção de cor (Step 3) |

### 6.3 Animações e Micro-interacções

| Elemento | Animação | Duração |
|----------|----------|---------|
| Transição entre steps | Slide horizontal | 300ms ease-in-out |
| Barra de progresso | Fill animado em dourado | Progressivo por step |
| Modelo 3D | Rotação automática de 15°/s; pausa ao hover | Contínuo |
| Cards de opção (hover) | Scale 1.03 + borda dourada | 150ms |
| Card seleccionado | Fundo azul-escuro + check dourado | 200ms |
| Ecrã de resultado | Fade-in + leve bounce no card principal | 400ms spring |
| Botão CTA | Pulse suave em loop | 2s |

---

## 7. Implementação Técnica

### 7.1 Estrutura de Ficheiros

```
/cardiagnose/
├── index.html              # Estrutura HTML do widget
├── style.css               # CSS: variáveis, layout, componentes, animações
├── app.js                  # Lógica principal: estado, navegação, árvore de decisão
├── data/
│   ├── questions.js        # Banco de perguntas por categoria (módulo JS)
│   └── packs.js            # Catálogo de packs com regras de recomendação
├── models/
│   ├── citadino.glb
│   ├── berlina.glb
│   ├── suv.glb
│   ├── carrinha.glb
│   ├── monovolume.glb
│   └── mota.glb
└── icons/
    └── *.svg               # Ícones para dores e tipos de veículo
```

### 7.2 Objecto de Estado (JavaScript)

```javascript
const state = {
  currentStep: 1,          // Step activo (1–5)
  painCategory: null,       // ID da dor: 'exterior' | 'interior' | 'odor' | 'riscos' | 'protecao' | 'completo'
  vehicleType: null,        // 'citadino' | 'berlina' | 'suv' | 'carrinha' | 'monovolume' | 'mota'
  vehicleBrand: '',         // Marca/modelo (opcional, para registo)
  vehicleColor: '#8A8A8A',  // Hex da cor seleccionada
  diagnosticAnswers: [],    // [{questionId: 'E1', score: 2}, ...]
  totalScore: 0,            // Soma dos scores do Step 4
  recommendedPack: null,    // Objecto do pack seleccionado
  alternativePack: null,    // Objecto do pack alternativo
  suvSurcharge: false,      // true se veículo tem taxa +2,50 €
};
```

### 7.3 Estrutura do `packs.js` com Hierarquia Comercial

```javascript
export const PACKS = {
  diamante: {
    id: 'diamante',
    nome: 'Pack Diamante',
    preco: 300,
    precoMax: 330,
    tier: 'principal',          // 🥇 — favorecido pelo motor
    durabilidade: '2 anos',
    itens: [
      'Polimento profissional',
      'Vitrificação nano-cerâmica',
      'Protecção contra riscos leves',
      'Repelência de água e UV',
      'Alto brilho duradouro',
    ],
    parcelamento: true,         // elegível para 4× sem juros
    ctaUrl: 'https://buk.pt/imperiodalavagemauto',
  },
  diamantePlus: {
    id: 'diamantePlus',
    nome: 'Pack Diamante Plus',
    preco: 360,
    tier: 'principal',
    itens: ['Tudo do Pack Diamante', 'Higienização Premium incluída'],
    parcelamento: true,
  },
  diamanteExclusive: {
    id: 'diamanteExclusive',
    nome: 'Pack Diamante Exclusive',
    preco: 400,
    tier: 'principal',
    itens: ['Tudo do Pack Diamante', 'Pack Zero Km incluído'],
    parcelamento: true,
  },
  higienizacaoPremium: {
    id: 'higienizacaoPremium',
    nome: 'Higienização Premium',
    preco: 100,
    tier: 'principal',
    itens: [
      'Lavagem completa exterior',
      'Lavagem de estofos',
      'Desinfeção por ozono premium',
      'Renovação plásticos (interior 6 meses / exterior 60 dias)',
      'Volante, cintos, palas de sol',
    ],
    parcelamento: true,
  },
  higienizacaoStandard: {
    id: 'higienizacaoStandard',
    nome: 'Higienização Standard',
    preco: 40,
    tier: 'principal',
    itens: [
      'Pré-lavagem e lavagem manual exterior',
      'Descontaminação férrea',
      'Aspiração profunda',
      'Lavagem de plásticos e tapetes',
      'Tratamento de ozono e abrilhantador de pneus',
    ],
    parcelamento: false,
  },
  brilhoProtecao: {
    id: 'brilhoProtecao',
    nome: 'Pack Brilho & Proteção 1 ano',
    preco: 240,
    precoMax: 270,
    tier: 'secundario',         // 🥈 — aparece apenas em scores baixos de riscos/protecção
    parcelamento: true,
  },
  // ... restantes packs com tier: 'residual'
};
```

### 7.4 Motor de Recomendação — Pseudocódigo

```javascript
function recommend(state) {
  const { painCategory, totalScore, vehicleType } = state;

  // Motas: fluxo separado
  if (vehicleType === 'mota') return recommendMota();

  // Árvore de decisão por dor e score
  const pack = decisionTree[painCategory](totalScore);

  // Ajuste de taxa SUV
  if (['suv', 'carrinha', 'monovolume'].includes(vehicleType)) {
    pack.precoFinal = pack.preco + 2.50;
    pack.surchargLabel = '(inclui taxa SUV +2,50 €)';
  } else {
    pack.precoFinal = pack.preco;
  }

  // Pack alternativo: tier imediatamente abaixo
  const alt = getAlternativePack(painCategory, totalScore);

  return { pack, alt };
}

// Exemplo: árvore para dor 'riscos'
const decisionTree = {
  riscos: (score) => {
    if (score >= 7)  return PACKS.diamante;          // Principal — score alto
    if (score >= 4)  return PACKS.brilhoProtecao;    // Secundário — score médio
    return PACKS.higienizacaoStandard;               // Fallback baixíssimo score
  },
  // ... demais categorias
};
```

### 7.5 Integração Three.js — Cor Dinâmica

```javascript
// Actualizar cor da carroçaria no modelo 3D
function applyCarColor(hexColor) {
  scene.traverse(child => {
    if (child.isMesh && child.name.includes('Body_Paint')) {
      child.material.color.setHex(
        parseInt(hexColor.replace('#', ''), 16)
      );
      child.material.needsUpdate = true;
    }
  });
}

// Chamar ao seleccionar cor no Step 3
colorPicker.addEventListener('input', (e) => {
  state.vehicleColor = e.target.value;
  applyCarColor(e.target.value);
  updateColorLabel(e.target.value);
});
```

### 7.6 Integração `<model-viewer>` (alternativa simples)

```html
<script type="module"
  src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js">
</script>

<model-viewer
  id="car3d"
  src="models/citadino.glb"
  auto-rotate
  camera-controls
  style="width: 100%; height: 400px;">
</model-viewer>
```

```javascript
// Trocar modelo ao seleccionar tipo de veículo
function loadVehicleModel(type) {
  document.getElementById('car3d').src = `models/${type}.glb`;
}

// Aproximação de cor via CSS filter (model-viewer não suporta material override nativo)
function applyColorFilter(hexColor) {
  const hue = hexToHue(hexColor); // função de conversão
  document.getElementById('car3d').style.filter =
    `hue-rotate(${hue}deg) saturate(1.3)`;
}
```

> **Nota:** Para cores exactas, usar Three.js (7.5). O `model-viewer` com filtro CSS é uma aproximação suficiente para citadinos, berlinas e cores neutras, mas perde precisão em tons escuros.

---

## 8. Requisitos do Sistema

### 8.1 Requisitos Funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF01 | Navegação de 5 steps com retrocesso possível em todos | CRÍTICA |
| RF02 | Step 1: 6 categorias de dor como cartões clicáveis com ícone + descrição | CRÍTICA |
| RF03 | Ao seleccionar tipo de veículo, modelo 3D correspondente é carregado | CRÍTICA |
| RF04 | Cor aplicada ao modelo 3D em < 500ms após selecção | ALTA |
| RF05 | Step 4 carrega apenas perguntas da categoria de dor do Step 1 | CRÍTICA |
| RF06 | Motor produz sempre 1 pack principal + 1 pack alternativo | CRÍTICA |
| RF07 | Pack ≥ 100 €: exibir automaticamente opção de parcelamento 4× | ALTA |
| RF08 | CTA abre link BUK em nova aba | CRÍTICA |
| RF09 | Widget reinicia sem recarregar a página | ALTA |
| RF10 | SUV / Carrinha / Monovolume: +2,50 € adicionados automaticamente | ALTA |
| RF11 | Motas: fluxo e tabela de preços próprios | ALTA |
| RF12 | Packs principais (Diamante, Premium, Standard) cobrem ≥ 75% das recomendações | CRÍTICA — regra comercial |

### 8.2 Requisitos Não Funcionais

| ID | Requisito | Métrica de aceitação |
|----|-----------|----------------------|
| RNF01 | Performance | < 3s em 4G; modelos 3D carregam progressivamente |
| RNF02 | Compatibilidade | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| RNF03 | Responsividade | Funcional de 375px (iPhone SE) a 1920px |
| RNF04 | Fallback WebGL | SVG estático da categoria se WebGL indisponível |
| RNF05 | Acessibilidade | Navegação por teclado; aria-labels em todos os controlos |
| RNF06 | Client-side only | Zero backend necessário |
| RNF07 | Peso dos assets | Modelos .glb < 2 MB cada; CSS + JS < 200 KB minificados |

---

## 9. Plano de Desenvolvimento

| Fase | Duração | Entregáveis | Dependências |
|------|---------|-------------|--------------|
| 1 — Setup | 3–4 dias | HTML base, CSS vars, layout responsivo (sem 3D) | — |
| 2 — Steps 1 e 2 | 3–4 dias | Cartões de dor e tipo de veículo com navegação funcional | Fase 1 |
| 3 — Modelo 3D | 4–5 dias | Integração Three.js / model-viewer; cor dinâmica no Step 3 | Modelos .glb disponíveis |
| 4 — Questionário | 3–4 dias | Step 4 com perguntas dinâmicas por categoria e pontuação | Fases 1–2 |
| 5 — Recomendação | 3–4 dias | Motor de decisão, ecrã de resultado, CTA BUK | Fase 4 |
| 6 — Polimento | 2–3 dias | Animações, testes cross-browser, fallback WebGL | Fases 1–5 |
| 7 — Integração | 1–2 dias | Publicação em `imperiodalavagem.vercel.app` + testes em produção | Acesso ao site |

**Estimativa total:** 19–26 dias · 1 developer frontend

> Os modelos .glb podem ser obtidos gratuitamente em **Poly Pizza** (poly.pizza), **Sketchfab** (filtrar CC Attribution) ou **Kenney.nl** (CC0). Estimar 1–2 dias adicionais para preparação e optimização dos modelos.

---

## 10. Métricas e Roadmap

### 10.1 KPIs de Sucesso (primeiros 90 dias)

| Métrica | Objectivo |
|---------|-----------|
| Taxa de conclusão do widget (Step 1 → Step 5) | > 60% dos que iniciam |
| Taxa de clique no CTA (Step 5) | > 30% dos que chegam ao resultado |
| % de recomendações nos 3 packs principais | > 75% |
| Ticket médio via widget vs. marcação directa | +20% |
| Packs ≥ 100 € como % do total recomendado | > 55% |
| Tempo médio de sessão no widget | 2–4 minutos |

### 10.2 Roadmap V2

- **Lead capture:** campo de e-mail no Step 5 → envio automático do diagnóstico por e-mail
- **WhatsApp:** botão no resultado que abre WhatsApp com o resumo do diagnóstico pré-preenchido
- **Analytics:** eventos GA4 por step, por categoria de dor, por pack recomendado
- **localStorage:** guardar último resultado e oferecer "ver a minha última recomendação"
- **Comparador:** slider interactivo Pack Principal vs. Pack Alternativo no ecrã de resultado
- **Iframe embebível:** com parâmetros UTM para tracking de fonte de tráfego
- **Veículos comerciais:** van / pickup para expansão de mercado

### 10.3 Fontes de Modelos 3D Gratuitos

| Plataforma | URL | Licença |
|------------|-----|---------|
| Poly Pizza | poly.pizza | CC0 — carros simples, optimizados para web |
| Sketchfab | sketchfab.com | CC Attribution — grande variedade; verificar peso |
| Kenney.nl | kenney.nl/assets | CC0 — estilo low-poly, funciona bem numa estética clean |
| TurboSquid | turbosquid.com | Verificar licença comercial nas opções gratuitas |

---

*Império da Lavagem Auto · CarDiagnose Widget · Especificação Técnica v1.1 · Maio 2025*
*"Onde o seu carro é tratado como realeza."*
