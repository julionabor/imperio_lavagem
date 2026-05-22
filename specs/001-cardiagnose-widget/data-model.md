# Data Model: CarDiagnose Widget

**Phase 1 output for** `specs/001-cardiagnose-widget/plan.md`
**Date**: 2026-05-22

---

## Overview

The widget is fully client-side. There is no database or persistent storage in V1. All data lives in JavaScript module constants (read-only catalogue data) and a single mutable runtime state object (session data).

---

## Runtime State Object

Represents the user's current session through the 5-step flow. Reset to initial values on widget restart.

```
WidgetState {
  currentStep       : integer (1–5)         — active step
  painCategory      : PainCategoryId | null — selected in Step 1
  vehicleType       : VehicleTypeId | null  — selected in Step 2
  vehicleBrand      : string                — optional, free text, Step 2
  vehicleColor      : hex string            — selected in Step 3, default "#8A8A8A"
  diagnosticAnswers : DiagnosticAnswer[]    — accumulated in Step 4
  totalScore        : integer               — sum of all answer scores
  recommendation    : Recommendation | null — computed at end of Step 4
}
```

**State transitions**:
- Step 1 → Step 2: requires `painCategory` set
- Step 2 → Step 3: requires `vehicleType` set
- Step 3 → Step 4: always allowed (colour has default)
- Step 4 → Step 5: requires all questions answered (`diagnosticAnswers.length === questions.length`)
- Step 5 → Step 1 (restart): full reset

---

## Catalogue Entities (read-only, defined in JS modules)

### PainCategory

Defined in `data/questions.js`. Six entries, one per `id`.

```
PainCategory {
  id          : string  — 'exterior' | 'interior' | 'odor' | 'riscos' | 'protecao' | 'completo'
  title       : string  — display name (Portuguese)
  description : string  — one-line description (Portuguese)
  iconFile    : string  — path to SVG icon
  questions   : Question[]  — 3–6 questions shown in Step 4
}
```

### Question

```
Question {
  id      : string  — e.g., 'E1', 'I2', 'O3'
  text    : string  — question text (Portuguese)
  options : QuestionOption[3]  — exactly 3 options
}
```

### QuestionOption

```
QuestionOption {
  label : string   — display text (Portuguese)
  score : integer  — 1 (mild), 2 (moderate), 3 (severe)
}
```

### DiagnosticAnswer (runtime, part of WidgetState)

```
DiagnosticAnswer {
  questionId : string   — matches Question.id
  score      : integer  — 1 | 2 | 3
}
```

### VehicleType

Defined in `data/packs.js` (or a separate `data/vehicles.js`). Six entries.

```
VehicleType {
  id        : string   — 'citadino' | 'berlina' | 'suv' | 'carrinha' | 'monovolume' | 'mota'
  label     : string   — display name (Portuguese)
  modelFile : string   — path to .glb asset, e.g., 'models/suv.glb'
  surcharge : number   — 0.00 or 2.50 (EUR)
  isMoto    : boolean  — true only for 'mota'; triggers separate flow
}
```

### ServicePack

Defined in `data/packs.js`. Catalogue of all available packs.

```
ServicePack {
  id             : string     — unique identifier, e.g., 'diamante', 'higienizacaoPremium'
  name           : string     — display name (Portuguese)
  priceMin       : number     — base price in EUR
  priceMax       : number     — max price (= priceMin if fixed, > priceMin if range)
  tier           : string     — 'principal' | 'secundario' | 'residual'
  includedItems  : string[]   — list of included treatments (Portuguese, 3–5 items)
  installments   : boolean    — true if eligible for 4× payment (priceMin >= 100)
  bookingUrl     : string     — URL to buk.pt booking page
}
```

### Recommendation (runtime, computed at Step 4 completion)

```
Recommendation {
  primaryPack      : ServicePack  — the recommended pack
  alternativePack  : ServicePack  — the fallback/simpler option
  finalPrice       : number       — primaryPack.priceMin + vehicleSurcharge
  surchargeApplied : boolean
  justification    : string       — personalised explanation sentence (Portuguese)
  installmentAmount: number | null — finalPrice / 4, or null if not eligible
}
```

---

## Decision Tree Logic

Defined as a pure function in `data/packs.js`:

```
recommend(painCategory: PainCategoryId, totalScore: integer, vehicleType: VehicleTypeId)
  → Recommendation

Input validation:
  - painCategory must be one of the 6 valid IDs
  - totalScore: 3–18 (3 questions × 1pt min to 6 questions × 3pt max)
  - vehicleType must be one of the 6 valid IDs

Special case:
  - IF vehicleType === 'mota' → return motoRecommendation(totalScore) [separate lookup table]

Main logic:
  1. Look up primaryPack using decisionTree[painCategory](totalScore)
  2. Look up alternativePack using alternativeTree[painCategory](totalScore)
  3. Calculate surcharge: vehicleType ∈ {suv, carrinha, monovolume} → +2.50 EUR
  4. Build justification string from template: justificationTemplates[painCategory][packId]
  5. Return Recommendation object
```

### Score Ranges by Pain Category

| Pain Category  | Min Score | Max Score | Question Count |
|----------------|-----------|-----------|----------------|
| exterior       | 4         | 12        | 4              |
| interior       | 4         | 12        | 4              |
| odor           | 3         | 9         | 3              |
| riscos         | 4         | 12        | 4              |
| protecao       | 3         | 9         | 3              |
| completo       | 3         | 9         | 3              |

---

## Motorcycle Special Flow

When `vehicleType === 'mota'`, the standard diagnostic questionnaire (Step 4) is skipped. Instead, the result screen shows a fixed lookup:

```
MotoServiceOption {
  engineClass : string  — 'até 125cc' | 'acima de 125cc'
  packName    : string  — 'Lavagem Completa Mota'
  price       : number  — 25 | 30
}
```

The widget skips from Step 3 directly to a simplified Step 5 result for motorcycles.

---

## Colour Palette (static data, inline in Step 3 UI)

12 predefined entries + custom picker:

| Label             | Hex       |
|-------------------|-----------|
| Branco            | #F5F5F5   |
| Preto             | #1A1A1A   |
| Cinzento          | #8A8A8A   |
| Prateado          | #C0C0C0   |
| Azul Escuro       | #1B3A6B   |
| Azul Claro        | #5B8DB8   |
| Vermelho          | #C0392B   |
| Verde             | #27AE60   |
| Bege / Champagne  | #D4B896   |
| Laranja           | #E67E22   |
| Amarelo           | #F1C40F   |
| Outra             | (native colour picker) |
