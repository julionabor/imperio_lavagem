# Research: CarDiagnose Widget

**Phase 0 output for** `specs/001-cardiagnose-widget/plan.md`
**Date**: 2026-05-22

---

## Decision 1: 3D Rendering Library

**Decision**: Use `<model-viewer>` (Google, loaded from CDN) for V1.

**Rationale**:
- Zero npm dependencies — fits the existing static site (no build step, no package.json).
- Built-in progressive GLB streaming, auto-rotate, and `camera-controls` reduce custom code to near zero.
- CDN delivery means the 3D library is cached across sites that also use it.
- Vehicle colour is applied via CSS `filter: hue-rotate(Xdeg) saturate(1.3)` — a V1-sufficient approximation that avoids material API complexity.

**Alternatives considered**:
- **Three.js**: Enables exact per-material colour override on named mesh objects (`Body_Paint`), but requires a module bundler or manual import-map configuration, and adds ~130 KB gzipped. Deferred to V2 if exact colour accuracy is required.

---

## Decision 2: Colour Visualisation Approach

**Decision**: CSS `filter: hue-rotate() saturate()` applied to the `<model-viewer>` element.

**Rationale**:
- `<model-viewer>` does not expose a direct Material API for dynamic colour changes without Three.js internals.
- CSS filter works immediately with zero JS changes to the 3D engine.
- Accurate enough for the 12 predefined colours and custom picker values in the spec.
- Limitations: dark colours (black, very dark navy) reduce filter effectiveness; neutral grey is unaffected by hue-rotate. Acceptable for V1 — the spec lists grey as the default.

**Hex → hue rotation formula**: `hueRotation = ((targetHue - baseModelHue) + 360) % 360`. Base model hue is measured once per GLB asset at export time.

**Alternatives considered**:
- **Three.js material override**: Exact colour on the `Body_Paint` mesh. Best UX but requires Three.js + correct mesh naming in every GLB. V2 upgrade path.

---

## Decision 3: Widget Integration into Existing Site

**Decision**: Self-contained `/cardiagnose/` subdirectory; widget section added to `index.html` as a new `#section_7` (or embedded as a standalone page at `cardiagnose/index.html` linked from the main site).

**Rationale**:
- The existing site is a single Bootstrap 5 `index.html` with no build step.
- A subdirectory keeps widget JS/CSS/assets isolated from the main site styles, preventing Bootstrap conflicts.
- The sidebar nav can link to `cardiagnose/index.html` or to an anchor in the main page — either works with the existing `main1.js` / `main2.js` scroll-spy.
- Preferred approach: standalone page (`cardiagnose/index.html`) with a "Diagnosticar o meu carro" CTA button on the main site hero section linking to it. Avoids Bootstrap grid conflicts entirely.

**Alternatives considered**:
- **Inline section in `index.html`**: Simpler deployment but risks CSS conflicts between widget styles and Bootstrap; widget's `<model-viewer>` CDN script load adds to main page weight.
- **`<iframe>` embed**: Cleanest isolation but cross-origin font/scroll issues; overkill for same-origin static site.

---

## Decision 4: JavaScript Module Architecture

**Decision**: ES6 native modules (`<script type="module">`) with no bundler.

**Rationale**:
- All target browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) support ES modules natively.
- Enables clean separation: `app.js` (state + navigation), `data/questions.js` (question bank), `data/packs.js` (pack catalogue + decision tree), `ui/model-viewer.js` (3D helpers).
- No build step required — matches existing project convention.

---

## Decision 5: 3D Model Asset Sourcing

**Decision**: Source GLB files from **Poly Pizza** (poly.pizza, CC0 licence) and/or **Kenney.nl** (kenney.nl/assets, CC0 licence).

**Rationale**:
- Both are CC0 — no attribution required, safe for commercial use.
- Low-poly assets optimised for web are available for citadino, berlina, SUV, carrinha/estate, monovolume, and mota categories.
- Target: each GLB < 2 MB after Draco compression in Blender (free) or `gltf-pipeline`.
- Model export requirement: bodywork mesh MUST be named `Body_Paint` (or equivalent) to enable future Three.js colour override in V2.

**Alternatives considered**:
- **Sketchfab**: Good quality but per-model licence check required; some CC BY models need attribution.
- **TurboSquid free tier**: Licence varies; commercial use requires paid licence for most models.

---

## Decision 6: Recommendation Engine Storage

**Decision**: Pure JS decision tree defined in `data/packs.js` — no external data store.

**Rationale**:
- All logic is deterministic (pain category + score → pack). No user data needs to persist for V1.
- Keeps the widget fully client-side (RNF06 from spec: zero backend required).
- Decision tree fits in a single JS module of < 200 lines.

---

## Resolved Clarifications

All spec items were unambiguous. No `[NEEDS CLARIFICATION]` markers were present in the spec.

**Asset dependency note**: 6 GLB model files must be sourced and placed in `cardiagnose/models/` before Step 2 and Step 3 can be tested end-to-end. This is a pre-development prerequisite (noted in spec Assumptions).
