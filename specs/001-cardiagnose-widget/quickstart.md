# Quickstart: CarDiagnose Widget Development

**Phase 1 output for** `specs/001-cardiagnose-widget/plan.md`
**Date**: 2026-05-22

---

## Prerequisites

- Any modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- A local HTTP server (required because ES6 modules cannot load over `file://`)
- (Optional) Blender for preparing/compressing `.glb` model files

---

## Local Development Setup

### Option A — Python (simplest, no install needed)

```bash
cd C:/Users/julio/OneDrive/Área\ de\ Trabalho/projetos/imperio_lavagem
python -m http.server 8080
```

Open `http://localhost:8080/cardiagnose/` in your browser.

### Option B — Node.js `serve`

```bash
npx serve .
```

Open `http://localhost:3000/cardiagnose/`.

### Option C — VS Code Live Server extension

Right-click `cardiagnose/index.html` → **Open with Live Server**.

---

## Project Structure

```
imperio_lavagem/                  ← repo root (existing site)
├── index.html                    ← existing main site (add CTA button linking to cardiagnose/)
├── css/                          ← existing site styles (do not modify)
├── js/                           ← existing site scripts (do not modify)
└── cardiagnose/                  ← NEW: widget directory
    ├── index.html                ← widget host page
    ├── style.css                 ← widget styles only
    ├── app.js                    ← widget entry point (ES6 module)
    ├── data/
    │   ├── questions.js          ← pain categories + question bank
    │   └── packs.js              ← service pack catalogue + recommend()
    ├── models/                   ← .glb files (sourced from Poly Pizza / Kenney.nl)
    │   ├── citadino.glb
    │   ├── berlina.glb
    │   ├── suv.glb
    │   ├── carrinha.glb
    │   ├── monovolume.glb
    │   └── mota.glb
    └── icons/                    ← SVG icons for pain categories + vehicle types
        ├── exterior.svg
        ├── interior.svg
        ├── odor.svg
        ├── riscos.svg
        ├── protecao.svg
        └── completo.svg
```

---

## Development Order (Recommended)

Follow the phased development plan to build incremental, testable slices:

1. **Phase 1 — HTML skeleton + CSS design tokens** (`cardiagnose/index.html` + `style.css`)
   - No JS yet; mock all 5 steps as static HTML
   - Verify responsive layout at 375px, 768px, 1024px, 1920px
   - Test on Chrome, Firefox, Safari, Edge

2. **Phase 2 — Steps 1 & 2** (pain category selection + vehicle type selection)
   - Add `app.js` with state object and step navigation
   - Stub the model-viewer with a placeholder `<div>`
   - Verify that clicking a pain card enables the "Seguinte" button

3. **Phase 3 — 3D model integration** (Step 2 + Step 3)
   - Add `<model-viewer>` CDN script
   - Load `.glb` files per vehicle type selection
   - Apply CSS colour filter on Step 3 colour selection
   - **Prerequisite**: `.glb` files must exist in `models/`

4. **Phase 4 — Diagnostic questionnaire** (Step 4)
   - Add `data/questions.js` with full question bank
   - Render questions dynamically based on `painCategory` from state
   - Implement progress bar (question N of total)
   - Accumulate `diagnosticAnswers` and compute `totalScore`

5. **Phase 5 — Recommendation engine + result screen** (Step 5)
   - Add `data/packs.js` with full pack catalogue and `recommend()` function
   - Render primary pack card + alternative pack card
   - Apply SUV surcharge logic
   - Show instalment option for packs ≥ 100 €
   - Wire booking CTA to `https://imperiodalavagemauto.buk.pt`

6. **Phase 6 — Polish + cross-browser testing**
   - Add step transition animations (CSS slide)
   - Add animated progress bar fill
   - Implement WebGL fallback (static SVG poster on `<model-viewer>`)
   - Test motorcycle flow end-to-end
   - Test restart flow without page reload
   - Test on real mobile device (iPhone SE viewport)

---

## Sourcing 3D Models

Models must be in `.glb` format, under 2 MB each. Recommended sources:

| Source         | URL                     | Licence | Notes |
|----------------|-------------------------|---------|-------|
| Poly Pizza     | poly.pizza              | CC0     | Search "car", "hatchback", "SUV", "motorcycle" |
| Kenney.nl      | kenney.nl/assets        | CC0     | "Vehicle Kit" pack includes multiple categories |

**After downloading**:
1. Open in Blender (free)
2. Name the bodywork mesh `Body_Paint` (for future V2 Three.js colour upgrade)
3. Export as `.glb` with Draco compression enabled
4. Verify file size < 2 MB
5. Place in `cardiagnose/models/<category>.glb`

---

## Testing the Recommendation Engine

Open the browser console and test the `recommend()` function directly:

```javascript
import { recommend } from './data/packs.js';

// Test: exterior pain, high score (should recommend Higienização Premium)
console.log(recommend('exterior', 11, 'citadino'));

// Test: riscos pain, high score, SUV (should recommend Pack Diamante + €2.50 surcharge)
console.log(recommend('riscos', 10, 'suv'));

// Test: odor pain, low score (should recommend Higienização Standard)
console.log(recommend('odor', 3, 'berlina'));

// Test: motorcycle (should bypass decision tree)
console.log(recommend('completo', 5, 'mota'));
```

Verify that ≥ 75% of possible (painCategory × score × vehicleType) combinations return a pack with `tier === 'principal'`.

---

## Deployment

The widget deploys as part of the existing Vercel static site — no additional configuration needed.

```bash
# Vercel auto-deploys on push to main
git add cardiagnose/
git commit -m "feat: add CarDiagnose widget"
git push origin main
```

Widget will be live at: `https://imperiodalavagem.vercel.app/cardiagnose/`

---

## Adding the CTA to the Main Site

In `index.html`, add a button in the `#section_1` hero area:

```html
<a href="cardiagnose/index.html"
   class="btn btn-warning btn-lg mt-3 fw-bold"
   style="background-color: #F2CC47; color: #0C1C33; border: none;">
  Diagnosticar o meu carro
</a>
```
