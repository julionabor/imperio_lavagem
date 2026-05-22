# Implementation Plan: CarDiagnose Widget

**Branch**: `main` | **Date**: 2026-05-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-cardiagnose-widget/spec.md`

---

## Summary

Build a 5-step interactive car diagnosis widget (`cardiagnose/`) embedded in the Império da Lavagem static site. The widget guides a car owner from pain category identification through vehicle personalisation and a scored diagnostic questionnaire to a personalised service pack recommendation with a direct booking CTA. Fully client-side, no build tools, no backend.

---

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES6+ (vanilla, native ES modules — no npm, no build step)

**Primary Dependencies**: `<model-viewer>` v3.4 (Google, CDN) for 3D vehicle rendering — no other runtime dependencies

**Storage**: None (fully client-side, no localStorage in V1)

**Testing**: Manual cross-browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) and responsive testing (375px → 1920px)

**Target Platform**: Web browser; self-contained `cardiagnose/` subdirectory deployed as a static page on Vercel alongside the existing site

**Project Type**: Frontend widget — standalone static HTML page linked from the main site hero CTA

**Performance Goals**: Widget fully interactive in < 3 seconds on 4G; 3D GLB assets load progressively; total CSS + JS < 200 KB minified

**Constraints**: Zero backend; no npm/build pipeline; `.glb` models < 2 MB each; responsive 375px–1920px; CSS/JS must not conflict with main site Bootstrap 5 instance

**Scale/Scope**: Single-user interactive flow; 6 pain categories; 6 vehicle types; ~30 diagnostic questions; 8 service packs in catalogue

---

## Constitution Check

*No project constitution has been defined — constitution.md is still a blank template. No gates to evaluate.*

All architectural decisions are documented in `research.md` with rationale. No violations.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-cardiagnose-widget/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── research.md          ← Phase 0: technology decisions
├── data-model.md        ← Phase 1: entities and state
├── quickstart.md        ← Phase 1: dev setup and testing guide
├── contracts/
│   └── widget-interface.md  ← Phase 1: embedding, events, file layout
└── tasks.md             ← Phase 2 output (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
cardiagnose/                  ← NEW widget directory
├── index.html                ← widget host page (standalone)
├── style.css                 ← widget styles (isolated from main site Bootstrap)
├── app.js                    ← entry point; state management + step navigation
├── data/
│   ├── questions.js          ← PAIN_CATEGORIES export (pain categories + question bank)
│   └── packs.js              ← PACKS export + recommend() function
├── models/
│   ├── citadino.glb          ← sourced from Poly Pizza / Kenney.nl (CC0)
│   ├── berlina.glb
│   ├── suv.glb
│   ├── carrinha.glb
│   ├── monovolume.glb
│   └── mota.glb
└── icons/
    ├── exterior.svg          ← pain category icons
    ├── interior.svg
    ├── odor.svg
    ├── riscos.svg
    ├── protecao.svg
    ├── completo.svg
    └── [vehicle-type SVGs]   ← citadino, berlina, suv, carrinha, monovolume, mota

index.html                    ← MODIFY: add "Diagnosticar o meu carro" CTA in hero section
```

**Structure Decision**: Self-contained `/cardiagnose/` subdirectory (Option 1 variant). Avoids Bootstrap CSS conflicts with the main site. The existing `index.html` needs only a CTA button added — no structural changes.

---

## Development Phases

### Phase 1 — HTML Skeleton + Design System (3–4 days)

**Goal**: All 5 steps exist as static HTML with correct layout. No JS logic yet.

**Deliverables**:
- `cardiagnose/index.html` — 5-step skeleton with progress bar, navigation buttons
- `cardiagnose/style.css` — CSS design tokens, responsive layout, card components, animations
- Static mock of Step 1 (pain category cards), Step 5 (result card layout)

**Design tokens** (from `CarDiagnose_Spec_v1.md`):
```css
--cor-primaria:   #0C1C33   /* dark navy */
--cor-destaque:   #F2CC47   /* gold — CTAs, active borders */
--cor-apoio:      #C9CFD8   /* light grey */
--cor-superficie: #F4F5F7   /* card background */
--cor-texto:      #1A2535   /* body text */
--fonte-display:  'Unbounded', sans-serif  /* reuses existing site font */
--raio-borda:     12px
--transicao:      300ms ease-in-out
```

**Done when**: Layout renders correctly at 375px, 768px, 1024px, 1920px with no broken elements.

---

### Phase 2 — Steps 1 & 2: Selection Logic (3–4 days)

**Goal**: Steps 1 and 2 are fully functional. State object initialised. Navigation works.

**Deliverables**:
- `cardiagnose/app.js` — state object + step navigation (next/back)
- `cardiagnose/data/questions.js` — PAIN_CATEGORIES export (6 categories with icons and descriptions)
- Step 1: 6 pain category cards; "Seguinte" button inactive until selection made
- Step 2: 6 vehicle type silhouette options; `<model-viewer>` placeholder (no GLB yet)

**Done when**: User can select a pain category → advance to Step 2 → select vehicle type → advance to Step 3.

---

### Phase 3 — 3D Model Integration (4–5 days)

**Prerequisite**: `.glb` model files must be sourced and placed in `cardiagnose/models/` before this phase.

**Goal**: Step 2 loads the correct 3D model on vehicle selection; Step 3 updates model colour in real time.

**Deliverables**:
- `<model-viewer>` integrated with CDN script
- 6 `.glb` models loaded dynamically based on `vehicleType` selection
- CSS `hue-rotate` + `saturate` filter applied on colour selection in Step 3
- Custom colour picker (`input[type=color"]`) wired to model filter
- Dynamic label: *"O teu SUV em Azul Escuro"*
- WebGL fallback: static SVG poster displayed if model-viewer fails to render

**Done when**: Selecting each vehicle type loads its 3D model; selecting each colour updates the model appearance; fallback SVG shows on WebGL-unavailable browser.

---

### Phase 4 — Diagnostic Questionnaire (3–4 days)

**Goal**: Step 4 renders the correct questions for the selected pain category and computes total score.

**Deliverables**:
- `cardiagnose/data/questions.js` — full question bank (30 questions across 6 categories)
- Step 4 renders questions one at a time with progress indicator
- Each answer stored in `diagnosticAnswers`; `totalScore` accumulated
- "Seguinte" button disabled until current question is answered

**Done when**: Completing Step 4 for each pain category produces a correct `totalScore` (manually verifiable against `CarDiagnose_Spec_v1.md` tables).

---

### Phase 5 — Recommendation Engine + Result Screen (3–4 days)

**Goal**: Step 5 displays the correct personalised recommendation based on pain category, score, and vehicle type.

**Deliverables**:
- `cardiagnose/data/packs.js` — full PACKS catalogue + `recommend()` function
- Decision tree implemented per `CarDiagnose_Spec_v1.md` Section 4
- SUV/Carrinha/Monovolume +€2.50 surcharge applied automatically
- Instalment option (4× sem juros) shown for packs ≥ €100
- Primary pack card: name, price, included items, gold badge, justification text
- Alternative pack card: smaller, grey badge, secondary CTA
- Primary CTA: "Marcar agora — [Pack Name]" → opens `https://imperiodalavagemauto.buk.pt` in new tab
- Contact fallback: phone + Instagram DM
- "Recomeçar" link triggers widget reset without page reload
- Motorcycle flow: Step 3 → simplified result (no Step 4 questionnaire)

**Done when**: All 6 pain categories × multiple score ranges produce the correct pack per `CarDiagnose_Spec_v1.md` decision table. Booking CTA opens buk.pt. Restart returns to Step 1 cleanly.

---

### Phase 6 — Polish & Cross-Browser Testing (2–3 days)

**Goal**: All animations, micro-interactions, and edge cases implemented; site-wide integration complete.

**Deliverables**:
- Step transition: CSS horizontal slide (300ms ease-in-out)
- Progress bar: animated gold fill by step
- 3D model: 15°/s auto-rotate; pause on hover
- Card hover: `scale(1.03)` + gold border (150ms)
- Selected card: dark navy background + gold checkmark (200ms)
- Result card: fade-in + spring bounce (400ms)
- CTA pulse: subtle loop animation (2s)
- `cardiagnose:*` custom DOM events wired up (for future analytics)
- CTA button added to `index.html` hero section
- Cross-browser testing: Chrome, Firefox, Safari, Edge
- Mobile device test: iPhone SE (375px)

**Done when**: Full flow tested end-to-end on all 4 browsers and on mobile viewport. No layout breaks. All FR-001 through FR-015 verified.

---

## Key Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `.glb` assets not sourced before Phase 3 | Medium | Use placeholder cube model for development; real models slot in before Phase 6 |
| CSS filter colour inaccuracy on dark colours | Low | Document limitation; schedule Three.js upgrade as V2 ticket |
| `<model-viewer>` CDN unavailable | Very Low | Add `crossorigin` + error handler; fallback to SVG poster (already in spec) |
| Bootstrap CSS from main site leaking into widget | Low | Widget in separate subdirectory with own CSS; no Bootstrap import in widget |

---

## Out of Scope (V1)

- Lead capture (email collection on result screen) — V2
- WhatsApp pre-fill button — V2
- GA4 analytics events beyond custom DOM events — V2
- `localStorage` for last recommendation — V2
- Three.js exact colour rendering — V2
- Vehicle commercial categories (van, pickup) — V2
