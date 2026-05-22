---

description: "Task list for CarDiagnose Widget implementation"
---

# Tasks: CarDiagnose Widget

**Input**: Design documents from `specs/001-cardiagnose-widget/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/widget-interface.md ✓, quickstart.md ✓

**Tests**: Not requested in spec — no test tasks included.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup

**Purpose**: Create directory structure and static foundations. No JS logic yet.

- [x] T001 Create `cardiagnose/` directory with subdirectories `data/`, `models/`, `icons/` per `contracts/widget-interface.md`
- [x] T002 [P] Create `cardiagnose/index.html` skeleton: `<html>`, `<head>` with CDN link for `<model-viewer>` v3.4, font import (`Unbounded` from Google Fonts), link to `style.css`, and `<script type="module" src="app.js">`, plus root `<div id="cardiagnose-root">`
- [x] T003 [P] Create `cardiagnose/style.css` with all CSS design tokens: `--cor-primaria: #0C1C33`, `--cor-destaque: #F2CC47`, `--cor-apoio: #C9CFD8`, `--cor-superficie: #F4F5F7`, `--cor-texto: #1A2535`, `--raio-borda: 12px`, `--sombra-card`, `--transicao: 300ms ease-in-out`, font-face for Unbounded
- [x] T004 [P] Create SVG icon files for 6 pain categories in `cardiagnose/icons/`: `exterior.svg`, `interior.svg`, `odor.svg`, `riscos.svg`, `protecao.svg`, `completo.svg` (simple line-art icons matching each category)
- [x] T005 [P] Create SVG silhouette files for 6 vehicle types in `cardiagnose/icons/`: `citadino.svg`, `berlina.svg`, `suv.svg`, `carrinha.svg`, `monovolume.svg`, `mota.svg` (side-profile outlines)

**Checkpoint**: `cardiagnose/index.html` opens in browser (blank page, no errors in console).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core app shell that all user stories build upon — step container, state object, navigation. MUST complete before any user story phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Create `cardiagnose/app.js` as ES6 module: define and export `WidgetState` object with all fields (`currentStep: 1`, `painCategory: null`, `vehicleType: null`, `vehicleBrand: ''`, `vehicleColor: '#8A8A8A'`, `diagnosticAnswers: []`, `totalScore: 0`, `recommendation: null`) per `data-model.md`
- [x] T007 [P] Add 5 step container `<section>` elements to `cardiagnose/index.html` with IDs `step-1` through `step-5`; only the active step is visible (`display: block`), others hidden (`display: none`)
- [x] T008 [P] Implement `showStep(n)` function in `cardiagnose/app.js`: hides all step containers, shows step `n`, updates `state.currentStep`
- [x] T009 [P] Add progress bar HTML structure to `cardiagnose/index.html` (5 segments) and progress bar base styles to `cardiagnose/style.css` (inactive: `--cor-apoio`; active: `--cor-destaque`)
- [x] T010 [P] Implement `updateProgressBar(step)` in `cardiagnose/app.js`: fills bar segments 1 through `step` in gold (`--cor-destaque`)
- [x] T011 [P] Add "Seguinte" (next) and "Voltar" (back) button HTML to each step container in `cardiagnose/index.html` and base button styles in `cardiagnose/style.css`
- [x] T012 Implement `goNext()` and `goBack()` navigation handlers in `cardiagnose/app.js`: call `showStep()` and `updateProgressBar()`; "Seguinte" is disabled by default until step validation passes
- [x] T013 [P] Add responsive two-column layout to `cardiagnose/style.css`: left column (form, 55%) + right column (3D panel, 45%) for desktop ≥1024px; stacked for tablet/mobile

**Checkpoint**: Page shows Step 1 container. Clicking "Seguinte" (manually enabled) advances to Step 2. "Voltar" returns. Progress bar updates. All at correct breakpoints.

---

## Phase 3: User Story 1 — Guided Diagnosis to Service Recommendation (Priority: P1) 🎯 MVP

**Goal**: Complete 5-step diagnosis flow — pain selection → vehicle type → colour → questionnaire → recommendation with booking CTA.

**Independent Test**: Complete all 5 steps starting from Step 1 and verify the result screen shows a named service pack with a price and a "Marcar agora" button that opens `https://imperiodalavagemauto.buk.pt` in a new tab.

### Implementation

- [x] T014 [P] [US1] Define `PAIN_CATEGORIES` array in `cardiagnose/data/questions.js`: 6 entries with `id`, `title`, `description`, `iconFile` per `data-model.md` and `CarDiagnose_Spec_v1.md` Section 3.1
- [x] T015 [P] [US1] Add full question bank to `PAIN_CATEGORIES` in `cardiagnose/data/questions.js`: 4 questions for `exterior`, 4 for `interior`, 3 for `odor`, 4 for `riscos`, 3 for `protecao`, 3 for `completo` — with exact text and 3 options each (1/2/3 pts) per `CarDiagnose_Spec_v1.md` Section 3.4
- [x] T016 [P] [US1] Define `PACKS` object in `cardiagnose/data/packs.js`: 8 service pack entries (`diamante`, `diamantePlus`, `diamanteExclusive`, `higienizacaoPremium`, `higienizacaoStandard`, `brilhoProtecao`, `tratamentoOzono`, `lavagBasica`) with `id`, `name`, `priceMin`, `priceMax`, `tier`, `includedItems`, `installments`, `bookingUrl` per `data-model.md`
- [x] T017 [US1] Implement `recommend(painCategoryId, totalScore, vehicleTypeId)` function in `cardiagnose/data/packs.js`: decision tree for all 6 pain categories per `CarDiagnose_Spec_v1.md` Section 4.1 tables; always returns `{ primaryPack, alternativePack, finalPrice, surchargeApplied, justification, installmentAmount }`
- [x] T018 [P] [US1] Render Step 1 pain category grid in `cardiagnose/app.js`: import `PAIN_CATEGORIES`, create 6 card elements per category (icon `<img>` + `<h3>` title + `<p>` description); inject into `#step-1`
- [x] T019 [US1] Wire Step 1 card selection in `cardiagnose/app.js`: clicking a card sets `state.painCategory`, adds active class (gold border + dark bg), and enables the "Seguinte" button
- [x] T020 [P] [US1] Render Step 2 vehicle type options in `cardiagnose/app.js`: 6 option cards with SVG silhouette + label; inject into `#step-2` (no 3D model yet — `<model-viewer>` placeholder div only)
- [x] T021 [US1] Wire Step 2 selection in `cardiagnose/app.js`: clicking sets `state.vehicleType`, adds active class, enables "Seguinte"; add optional brand/model text field that stores to `state.vehicleBrand`
- [x] T022 [US1] Render Step 3 colour palette in `cardiagnose/app.js`: 12 colour swatches (hex values from `data-model.md` colour table) + `<input type="color">` for custom; inject into `#step-3`; default selected colour is grey (`#8A8A8A`)
- [x] T023 [US1] Wire Step 3 colour selection in `cardiagnose/app.js`: clicking a swatch or changing the picker sets `state.vehicleColor`; Step 3 always allows "Seguinte" (colour has default)
- [x] T024 [P] [US1] Render Step 4 questionnaire in `cardiagnose/app.js`: load questions for `state.painCategory` from `PAIN_CATEGORIES`; display questions one at a time; show question N of total count above the question text; inject into `#step-4`
- [x] T025 [US1] Wire Step 4 answer selection in `cardiagnose/app.js`: clicking an option stores `{ questionId, score }` into `state.diagnosticAnswers`, accumulates `state.totalScore`, shows next question (or enables "Seguinte" when all answered)
- [x] T026 [US1] Call `recommend(state.painCategory, state.totalScore, state.vehicleType)` on Step 4 completion in `cardiagnose/app.js`; store result in `state.recommendation`; call `showStep(5)`
- [x] T027 [P] [US1] Render Step 5 primary pack card in `cardiagnose/app.js`: pack name, price (with SUV surcharge if applicable), gold "🏆 RECOMENDAÇÃO PRINCIPAL" badge, `includedItems` list, `justification` sentence; inject into `#step-5`
- [x] T028 [US1] Render Step 5 alternative pack card in `cardiagnose/app.js`: smaller card with grey "⭐ OPÇÃO ALTERNATIVA" badge, pack name, price, secondary "Marcar" button; inject below primary card in `#step-5`
- [x] T029 [US1] Show instalment line in Step 5 when `state.recommendation.installmentAmount !== null` in `cardiagnose/app.js`: text *"Disponível em 4× de X€ sem juros — solicita na marcação."*
- [x] T030 [US1] Render Step 5 contact fallback line in `cardiagnose/app.js`: *"Tens dúvidas? Liga: 96 44 550 06 ou envia DM no Instagram."*
- [x] T031 [US1] Wire "Marcar agora — [Pack Name]" primary CTA button in `cardiagnose/app.js`: opens `state.recommendation.primaryPack.bookingUrl` in new tab (`target="_blank" rel="noopener noreferrer"`)
- [x] T032 [P] [US1] Style all step components in `cardiagnose/style.css`: pain category cards, vehicle type cards, colour swatches, question option buttons, result pack cards (gold tier badge, grey alt badge), CTA button, contact line

**Checkpoint**: Full 5-step flow works end-to-end. Every pain category × score combination produces a recommendation. "Marcar agora" opens buk.pt in new tab. SUV adds +€2.50. Packs ≥ €100 show instalment line.

---

## Phase 4: User Story 2 — Emotional Vehicle Visualisation (Priority: P2)

**Goal**: 3D model loads on vehicle type selection (Step 2); bodywork colour updates in real time on colour selection (Step 3).

**Independent Test**: Select SUV in Step 2 — a 3D model appears. Select Vermelho (`#C0392B`) in Step 3 — the model's colour shifts toward red.

### Implementation

- [x] T033 [P] [US2] Add `<model-viewer id="car3d">` element with `auto-rotate`, `camera-controls`, `poster="icons/citadino.svg"` (fallback), and responsive sizing styles to the 3D panel in `cardiagnose/index.html`
- [x] T034 [US2] Implement `loadVehicleModel(vehicleTypeId)` in `cardiagnose/app.js`: sets `document.getElementById('car3d').src` to `models/${vehicleTypeId}.glb`; call this from the Step 2 selection handler (T021) after setting `state.vehicleType`
- [x] T035 [P] [US2] Implement `hexToHueRotation(hex)` utility in `cardiagnose/app.js`: converts a hex colour string to a CSS `hue-rotate` degree value relative to the base model hue (neutral grey `#8A8A8A` = 0°)
- [x] T036 [US2] Implement `applyColorFilter(hex)` in `cardiagnose/app.js`: applies `filter: hue-rotate(Xdeg) saturate(1.3)` to `#car3d`; call this from Step 3 colour selection handler (T023)
- [x] T037 [US2] Update dynamic label `"O teu [vehicleType label] em [colour label]"` below `<model-viewer>` in `cardiagnose/app.js` whenever vehicle type or colour changes; inject into a `<p id="car-label">` element in `cardiagnose/index.html`
- [x] T038 [US2] Wire custom colour picker (`input[type="color"]`) to call `applyColorFilter()` and update label on `input` event in `cardiagnose/app.js`
- [x] T039 [P] [US2] Add responsive 3D panel layout to `cardiagnose/style.css`: right column 45% width on desktop (≥1024px); top 40% height on tablet (768–1024px); hidden until Step 2 selection on mobile (<768px), then shown below form

**Checkpoint**: Select each of 6 vehicle types → correct model loads. Select each of 12 palette colours → CSS filter updates. Custom picker → model filter updates live. Static SVG poster shows if model fails to load (WebGL off).

---

## Phase 5: User Story 3 — Motorcycle Owner Separate Flow (Priority: P3)

**Goal**: Selecting Mota in Step 2 skips the diagnostic questionnaire and shows a motorcycle-specific result screen with fixed pricing.

**Independent Test**: Select Mota in Step 2 → advance through Step 3 → result screen shows "Lavagem Completa Mota" with €25/€30 engine-class options and a booking CTA.

### Implementation

- [x] T040 [US3] Add `isMoto` boolean check in `goNext()` navigation handler in `cardiagnose/app.js`: when `state.vehicleType === 'mota'` and moving from Step 3, call `showStep(5)` directly (skip Step 4)
- [x] T041 [US3] Render motorcycle result screen in Step 5 in `cardiagnose/app.js` when `state.vehicleType === 'mota'`: show engine class selector (≤125cc = €25 / >125cc = €30), pack name "Lavagem Completa Mota", list of included services from `CarDiagnose_Spec_v1.md` Section 4.3
- [x] T042 [US3] Wire motorcycle result CTA "Marcar agora" in `cardiagnose/app.js`: opens `https://imperiodalavagemauto.buk.pt` in new tab; no instalment option shown for motorcycle packs

**Checkpoint**: Selecting Mota → Step 3 → Step 5 directly (Step 4 never shown). Result shows motorcycle pricing. Booking CTA works.

---

## Phase 6: User Story 4 — Restart Without Page Reload (Priority: P3)

**Goal**: "Recomeçar o diagnóstico" on Step 5 resets the widget to Step 1 with all selections cleared.

**Independent Test**: Complete full 5-step flow → click "Recomeçar" → Step 1 displays with no cards selected, progress bar reset to 0.

### Implementation

- [x] T043 [US4] Implement `resetWidget()` in `cardiagnose/app.js`: resets `state` to initial values (keeping `vehicleBrand` as UX convenience), calls `showStep(1)`, calls `updateProgressBar(1)`, clears all active-class selections from DOM cards
- [x] T044 [US4] Add "Recomeçar o diagnóstico" link element to `#step-5` result screen HTML in `cardiagnose/index.html`; style as subtle text link (not a button) in `cardiagnose/style.css`
- [x] T045 [US4] Wire "Recomeçar" link click event to `resetWidget()` in `cardiagnose/app.js`; confirm no page reload occurs

**Checkpoint**: After restart, Step 1 renders cleanly. Progress bar is at step 1. No previous selections visible. Widget flows correctly through a second complete diagnosis.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Animations, accessibility, DOM events contract, WebGL fallback, and main site integration.

- [x] T046 [P] Add step transition CSS animation to `cardiagnose/style.css`: horizontal slide (translateX 100% → 0) with 300ms ease-in-out on `.step-enter` class; apply class in `showStep()` in `cardiagnose/app.js`
- [x] T047 [P] Add animated progress bar fill to `cardiagnose/style.css`: CSS transition on `width` property of the gold fill segment, triggered by `updateProgressBar()`
- [x] T048 [P] Add card hover micro-interaction to `cardiagnose/style.css`: `.pain-card:hover`, `.vehicle-card:hover` → `transform: scale(1.03)`, gold border, 150ms transition
- [x] T049 [P] Add selected card state styles to `cardiagnose/style.css`: `.pain-card.selected`, `.vehicle-card.selected` → dark navy background (`--cor-primaria`), white text, gold checkmark pseudo-element, 200ms transition
- [x] T050 [P] Add result card entrance animation to `cardiagnose/style.css`: `.result-primary` → fade-in + `translateY` spring effect (400ms); `.result-alt` → fade-in 200ms delay
- [x] T051 [P] Add CTA button pulse animation to `cardiagnose/style.css`: `@keyframes pulse` on `.btn-cta-primary` — subtle box-shadow glow loop, 2s infinite
- [x] T052 [P] Add `<model-viewer>` `poster` attribute to each vehicle type `.glb` reference in `cardiagnose/app.js`: `poster="icons/${vehicleTypeId}.svg"` so the static SVG shows while GLB loads or if WebGL is unavailable (implements FR-015)
- [x] T053 [P] Dispatch `cardiagnose:step-changed` custom DOM event in `showStep()` in `cardiagnose/app.js`: `new CustomEvent('cardiagnose:step-changed', { detail: { from: prev, to: n }, bubbles: true })`
- [x] T054 [P] Dispatch `cardiagnose:recommendation-shown` custom DOM event when Step 5 renders in `cardiagnose/app.js`: detail includes `{ packId, packName, score, painCategory }` per `contracts/widget-interface.md`
- [x] T055 [P] Dispatch `cardiagnose:booking-clicked` event on CTA click and `cardiagnose:restarted` event in `resetWidget()` in `cardiagnose/app.js` per `contracts/widget-interface.md`
- [x] T056 Add "Diagnosticar o meu carro" CTA button to `#section_1` hero area in `index.html`: `<a href="cardiagnose/index.html">` with gold button styles matching site branding (per `quickstart.md`)
- [ ] T057 Cross-browser test: open `http://localhost:8080/cardiagnose/` in Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ — complete full 5-step flow in each; verify no layout or JS errors
- [ ] T058 Mobile viewport test: open widget at 375px width (iPhone SE) — verify all steps are navigable, 3D panel appears after Step 2 selection, CTA is tappable

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user story phases**
- **US1 (Phase 3)**: Depends on Phase 2 — no dependency on US2/US3/US4
- **US2 (Phase 4)**: Depends on Phase 2 and Phase 3 (US1 wires vehicle selection T021 which US2 extends in T034)
- **US3 (Phase 5)**: Depends on Phase 2 and Phase 3 (reuses `showStep()`, Step 2 vehicle selection)
- **US4 (Phase 6)**: Depends on Phase 2 and Phase 3 (Step 5 result screen must exist first)
- **Polish (Phase 7)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. Independent of US2/US3/US4.
- **US2 (P2)**: Starts after Phase 2. Extends US1's Step 2 and Step 3 handlers — implement after T021 and T023 are complete.
- **US3 (P3)**: Starts after Phase 2. Extends US1's navigation — implement after T026 is complete.
- **US4 (P3)**: Starts after Phase 2. Extends US1's Step 5 screen — implement after T027–T031 are complete.

### Within Each Phase

- `[P]` tasks within a phase have no dependencies on each other — run in parallel
- Data modules (T014–T017) must complete before the UI tasks that import them (T018+)
- `recommend()` (T017) must complete before T026 calls it

### Parallel Opportunities

```bash
# Phase 1 — all parallel:
T002 (index.html skeleton) | T003 (CSS tokens) | T004 (pain icons) | T005 (vehicle icons)

# Phase 2 — parallel groups:
T007 (step containers) | T009 (progress bar HTML) | T011 (nav buttons HTML)  # markup
T008 (showStep fn) | T010 (updateProgressBar fn) | T012 (goNext/goBack)      # JS (after T006)
T013 (responsive layout CSS)

# Phase 3 — parallel groups:
T014+T015 (questions.js) | T016 (packs.js catalogue)  # data modules
T017 (recommend fn) — after T016
T018 (Step 1 render) | T020 (Step 2 render) | T022 (Step 3 render) | T024 (Step 4 render) — after T014
T032 (component styles)

# Phase 7 — most tasks parallel:
T046 | T047 | T048 | T049 | T050 | T051 | T052 | T053 | T054 | T055
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (T014–T032)
4. **STOP and VALIDATE**: Complete the 5-step flow; verify recommendation logic against all 6 pain categories; verify booking CTA
5. Deploy to Vercel: `git push origin main` → widget live at `https://imperiodalavagem.vercel.app/cardiagnose/`

### Incremental Delivery

1. Setup + Foundational → app shell with step navigation
2. **US1** → Full working diagnosis flow (no 3D yet) → **MVP deploy**
3. **US2** → Add 3D model + colour → visual differentiation deploy
4. **US3** → Motorcycle flow → expanded audience deploy
5. **US4** → Restart flow → UX polish deploy
6. **Phase 7** → Animations + DOM events + cross-browser → production-ready deploy

### Asset Prerequisite Note

Phases 4 (US2) requires `.glb` model files in `cardiagnose/models/`. Source these from Poly Pizza or Kenney.nl (CC0) and prepare with Blender before starting T034. US1 (Phase 3) can be fully completed and validated without the `.glb` files.

---

## Notes

- `[P]` tasks modify different files or independent DOM elements — safe to run in parallel
- `[Story]` label maps each task to its user story for traceability to spec.md acceptance criteria
- US1 delivers full business value as a standalone MVP (no 3D, no animations)
- `.glb` sourcing is the only external dependency that can block Phase 4
- Commit after each phase checkpoint to maintain a deployable branch at all times
