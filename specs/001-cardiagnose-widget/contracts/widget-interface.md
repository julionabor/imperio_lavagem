# Widget Interface Contract: CarDiagnose

**Phase 1 output for** `specs/001-cardiagnose-widget/plan.md`
**Date**: 2026-05-22

This document defines the public interface of the CarDiagnose widget — how it is embedded, configured, and how it communicates with the host page.

---

## 1. Embedding

The widget is a standalone HTML page at `cardiagnose/index.html`. It is linked from the main site, not embedded inline. The host page (main `index.html`) provides a CTA button:

```html
<!-- In index.html hero section -->
<a href="cardiagnose/index.html" class="btn btn-primary btn-lg">
  Diagnosticar o meu carro
</a>
```

The widget page loads its own CSS and JS independently; it does not inherit styles from the main site's Bootstrap instance.

---

## 2. Widget Page Structure

`cardiagnose/index.html` must include:

```html
<!-- 3D viewer library (CDN) -->
<script type="module"
  src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js">
</script>

<!-- Widget styles -->
<link rel="stylesheet" href="style.css">

<!-- Widget entry point (ES6 module) -->
<script type="module" src="app.js"></script>

<!-- Root mount element -->
<div id="cardiagnose-root"></div>
```

---

## 3. File Layout Contract

The following paths are contractual — JS modules import from these locations. Renaming or moving these files is a breaking change.

```
cardiagnose/
├── index.html              — widget host page
├── style.css               — all widget styles (no external CSS except model-viewer)
├── app.js                  — entry point; initialises state, mounts steps
├── data/
│   ├── questions.js        — exports: PAIN_CATEGORIES (array of PainCategory objects)
│   └── packs.js            — exports: PACKS (object), recommend() function
├── models/
│   ├── citadino.glb
│   ├── berlina.glb
│   ├── suv.glb
│   ├── carrinha.glb
│   ├── monovolume.glb
│   └── mota.glb
└── icons/
    ├── exterior.svg
    ├── interior.svg
    ├── odor.svg
    ├── riscos.svg
    ├── protecao.svg
    └── completo.svg
```

---

## 4. JavaScript Module Exports

### `data/questions.js`

```javascript
// Named export
export const PAIN_CATEGORIES = [
  {
    id: 'exterior',
    title: 'Exterior sujo ou opaco',
    description: 'O brilho desapareceu e a pintura parece baça.',
    iconFile: 'icons/exterior.svg',
    questions: [ /* Question objects */ ]
  },
  // ... 5 more
];
```

### `data/packs.js`

```javascript
// Named exports
export const PACKS = { /* ServicePack objects keyed by id */ };

export function recommend(painCategoryId, totalScore, vehicleTypeId) {
  // Returns: { primaryPack, alternativePack, finalPrice, surchargeApplied,
  //            justification, installmentAmount }
}
```

### `app.js`

```javascript
// No public exports — self-initialising module
// Reads DOM element: document.getElementById('cardiagnose-root')
// Manages all state internally
```

---

## 5. DOM Events (Custom Events)

The widget dispatches the following `CustomEvent`s on `document` for optional integration with analytics or parent page tracking. All events bubble.

| Event Name                      | `detail` Payload                                        | Fired When |
|---------------------------------|---------------------------------------------------------|------------|
| `cardiagnose:step-changed`      | `{ from: number, to: number }`                          | User navigates to a new step |
| `cardiagnose:recommendation-shown` | `{ packId: string, packName: string, score: number, painCategory: string }` | Step 5 result is displayed |
| `cardiagnose:booking-clicked`   | `{ packId: string, packName: string, finalPrice: number }` | User clicks the main booking CTA |
| `cardiagnose:restarted`         | `{}`                                                    | User clicks "Recomeçar" |

**Example listener** (for future analytics integration):

```javascript
document.addEventListener('cardiagnose:booking-clicked', (e) => {
  // e.detail = { packId, packName, finalPrice }
  console.log('Booking intent:', e.detail);
});
```

---

## 6. Booking Redirect Contract

The primary CTA button navigates to the external booking system:

- **URL**: `https://imperiodalavagemauto.buk.pt`
- **Opens in**: new browser tab (`target="_blank"`, `rel="noopener noreferrer"`)
- **Behaviour**: The widget does not track whether the booking was completed. The redirect is one-way.
- **Fallback**: If the URL is unavailable, the button still renders and navigates; error handling is the responsibility of the external booking system.

---

## 7. Fallback Contract (No WebGL)

When the browser cannot render `<model-viewer>` (WebGL unavailable or JS disabled):

- The `<model-viewer>` element's `poster` attribute MUST point to a static PNG/SVG fallback image for the selected vehicle category.
- The widget MUST remain fully functional (all 5 steps navigable) without the 3D model.
- The colour selection step (Step 3) MUST still accept colour input; the colour label updates even if no 3D visual updates.

---

## 8. Reset Contract

Calling `cardiagnose:restarted` (or the internal `resetWidget()` function) MUST:

1. Set `currentStep = 1`
2. Clear all user selections (`painCategory`, `vehicleType`, `vehicleColor` → default `#8A8A8A`, `diagnosticAnswers = []`, `totalScore = 0`, `recommendation = null`)
3. Re-render Step 1 without a page reload
4. NOT clear `vehicleBrand` (minor UX convenience — user likely has the same car)
