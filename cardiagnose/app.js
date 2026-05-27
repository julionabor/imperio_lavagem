/**
 * CarDiagnose Widget — Main Application
 * Império da Lavagem Auto
 *
 * ES6 module — no build step required.
 * Runs at: cardiagnose/index.html
 */

import { PAIN_CATEGORIES, VEHICLE_TYPES, COLOR_PALETTE } from './data/questions.js';
import { recommend, MOTO_OPTIONS, MOTO_INCLUDES } from './data/packs.js';

// ─── Car silhouette SVGs ──────────────────────────────────────────────────────
// Body fill uses currentColor — set `color` CSS prop on #car-preview to repaint.

const CAR_SVGS = {
  berlina: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 100">
    <path fill="currentColor" stroke="#00000022" stroke-width="1.5"
      d="M12,88 L12,74 Q16,62 28,54 L50,40 L70,26 L88,22 L172,22 L198,30 L220,52 Q232,66 238,76 L244,82 L244,88
         L215,88 A17,17 0 0,0 181,88 L79,88 A17,17 0 0,0 45,88 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M72,26 L88,22 L112,22 L112,54 L72,54 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M115,22 L154,22 L154,54 L115,54 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M157,22 L172,22 L198,30 L218,52 L157,52 Z"/>
    <circle cx="62" cy="88" r="17" fill="#1a1a1a"/>
    <circle cx="62" cy="88" r="10" fill="#555"/>
    <circle cx="62" cy="88" r="4"  fill="#aaa"/>
    <circle cx="198" cy="88" r="17" fill="#1a1a1a"/>
    <circle cx="198" cy="88" r="10" fill="#555"/>
    <circle cx="198" cy="88" r="4"  fill="#aaa"/>
    <path fill="#fff8cc" opacity="0.95" d="M12,68 Q12,60 18,57 L24,57 Q26,60 26,66 L26,72 Q18,74 12,70 Z"/>
    <rect fill="#e53935" opacity="0.9" x="238" y="62" width="6" height="16" rx="1"/>
  </svg>`,

  suv: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 100">
    <path fill="currentColor" stroke="#00000022" stroke-width="1.5"
      d="M10,88 L10,68 Q14,56 24,46 L44,30 L62,16 L84,12 L176,12 L200,18 Q218,32 230,54 L238,70 L244,80 L244,88
         L214,88 A19,19 0 0,0 176,88 L84,88 A19,19 0 0,0 46,88 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M64,16 L84,12 L114,12 L114,56 L62,50 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M117,12 L174,12 L174,56 L117,56 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M177,12 L200,18 L220,54 L177,54 Z"/>
    <circle cx="65" cy="88" r="19" fill="#1a1a1a"/>
    <circle cx="65" cy="88" r="11" fill="#555"/>
    <circle cx="65" cy="88" r="5"  fill="#aaa"/>
    <circle cx="195" cy="88" r="19" fill="#1a1a1a"/>
    <circle cx="195" cy="88" r="11" fill="#555"/>
    <circle cx="195" cy="88" r="5"  fill="#aaa"/>
    <path fill="#fff8cc" opacity="0.95" d="M10,65 Q10,56 16,52 L22,52 Q25,56 25,63 L25,70 Q17,72 10,68 Z"/>
    <rect fill="#e53935" opacity="0.9" x="238" y="58" width="6" height="18" rx="1"/>
  </svg>`,

  citadino: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 100">
    <path fill="currentColor" stroke="#00000022" stroke-width="1.5"
      d="M18,88 L18,76 Q22,66 30,58 L46,44 L64,30 L82,24 L166,24 L186,34 Q205,52 218,68 L224,78 L226,88
         L197,88 A15,15 0 0,0 167,88 L73,88 A15,15 0 0,0 43,88 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M66,30 L82,24 L108,24 L108,56 L66,56 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M111,24 L157,24 L157,56 L111,56 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M160,24 L166,24 L186,34 L210,60 L160,58 Z"/>
    <circle cx="58" cy="88" r="15" fill="#1a1a1a"/>
    <circle cx="58" cy="88" r="9"  fill="#555"/>
    <circle cx="58" cy="88" r="4"  fill="#aaa"/>
    <circle cx="182" cy="88" r="15" fill="#1a1a1a"/>
    <circle cx="182" cy="88" r="9"  fill="#555"/>
    <circle cx="182" cy="88" r="4"  fill="#aaa"/>
    <path fill="#fff8cc" opacity="0.95" d="M18,72 Q18,64 24,61 L29,61 Q31,64 31,70 L31,76 Q23,78 18,74 Z"/>
    <rect fill="#e53935" opacity="0.9" x="220" y="66" width="6" height="14" rx="1"/>
  </svg>`,

  carrinha: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 100">
    <path fill="currentColor" stroke="#00000022" stroke-width="1.5"
      d="M12,88 L12,74 Q16,62 28,54 L50,40 L70,26 L88,22 L206,22 L228,50 Q238,64 242,76 L244,84 L244,88
         L219,88 A17,17 0 0,0 185,88 L79,88 A17,17 0 0,0 45,88 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M72,26 L88,22 L112,22 L112,54 L72,54 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M115,22 L196,22 L196,54 L115,54 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M199,22 L206,22 L228,52 L233,50 L214,22 Z"/>
    <circle cx="62" cy="88" r="17" fill="#1a1a1a"/>
    <circle cx="62" cy="88" r="10" fill="#555"/>
    <circle cx="62" cy="88" r="4"  fill="#aaa"/>
    <circle cx="202" cy="88" r="17" fill="#1a1a1a"/>
    <circle cx="202" cy="88" r="10" fill="#555"/>
    <circle cx="202" cy="88" r="4"  fill="#aaa"/>
    <path fill="#fff8cc" opacity="0.95" d="M12,68 Q12,60 18,57 L24,57 Q26,60 26,66 L26,72 Q18,74 12,70 Z"/>
    <rect fill="#e53935" opacity="0.9" x="238" y="60" width="6" height="18" rx="1"/>
  </svg>`,

  monovolume: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 100">
    <path fill="currentColor" stroke="#00000022" stroke-width="1.5"
      d="M20,88 L20,70 Q24,58 32,48 L48,32 L66,18 L90,12 L182,12 L204,20 Q222,38 232,60 L238,74 L242,84 L242,88
         L211,88 A16,16 0 0,0 179,88 L84,88 A16,16 0 0,0 52,88 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M68,18 L90,12 L116,12 L116,56 L66,50 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M119,12 L175,12 L175,56 L119,56 Z"/>
    <path fill="#1e3a5f" opacity="0.58" d="M178,12 L204,20 L225,58 L178,58 Z"/>
    <circle cx="68" cy="88" r="16" fill="#1a1a1a"/>
    <circle cx="68" cy="88" r="10" fill="#555"/>
    <circle cx="68" cy="88" r="4"  fill="#aaa"/>
    <circle cx="195" cy="88" r="16" fill="#1a1a1a"/>
    <circle cx="195" cy="88" r="10" fill="#555"/>
    <circle cx="195" cy="88" r="4"  fill="#aaa"/>
    <path fill="#fff8cc" opacity="0.95" d="M20,66 Q20,56 26,52 L32,52 Q34,56 34,64 L34,72 Q26,74 20,68 Z"/>
    <rect fill="#e53935" opacity="0.9" x="236" y="58" width="6" height="20" rx="1"/>
  </svg>`,

  mota: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 100">
    <circle cx="75" cy="78" r="22" fill="#1a1a1a"/>
    <circle cx="75" cy="78" r="13" fill="#555"/>
    <circle cx="75" cy="78" r="5"  fill="#aaa"/>
    <circle cx="192" cy="80" r="20" fill="#1a1a1a"/>
    <circle cx="192" cy="80" r="12" fill="#555"/>
    <circle cx="192" cy="80" r="5"  fill="#aaa"/>
    <line x1="75" y1="70" x2="122" y2="64" stroke="#666" stroke-width="4" stroke-linecap="round"/>
    <line x1="106" y1="62" x2="146" y2="44" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
    <path fill="currentColor" stroke="#00000020" stroke-width="1"
      d="M106,44 Q120,34 150,36 L160,44 Q152,56 132,57 Q112,57 106,50 Z"/>
    <path fill="currentColor" stroke="#00000020" stroke-width="1" opacity="0.8"
      d="M88,50 Q100,44 106,46 Q113,54 132,56 L86,58 Z"/>
    <rect fill="currentColor" opacity="0.75" stroke="#00000020" stroke-width="1" x="107" y="58" width="42" height="18" rx="4"/>
    <line x1="162" y1="44" x2="180" y2="64" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
    <line x1="168" y1="46" x2="188" y2="66" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
    <path fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"
      d="M158,40 Q165,32 173,36 Q179,38 181,44"/>
    <path fill="none" stroke="#888" stroke-width="4" stroke-linecap="round"
      d="M120,76 Q148,79 168,74 L185,76"/>
    <circle cx="205" cy="64" r="12" fill="#fff8cc" opacity="0.92"/>
    <circle cx="205" cy="64" r="7"  fill="#fff" opacity="0.65"/>
    <rect fill="#e53935" opacity="0.9" x="57" y="54" width="8" height="12" rx="2"/>
  </svg>`,
};

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  currentStep: 1,
  painCategory: null,      // PainCategory id string
  vehicleType: null,        // VehicleType id string
  vehicleBrand: '',
  vehicleColor: '#8A8A8A',
  colorLabel: 'Cinzento',
  diagnosticAnswers: [],    // [{ questionId, score }]
  currentQuestionIndex: 0,
  totalScore: 0,
  recommendation: null,
  motoClass: null,          // 'até 125cc' | 'acima de 125cc'
};

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const root = document.getElementById('cardiagnose-root');

// ─── Utility ─────────────────────────────────────────────────────────────────

function fmt(price) {
  return price.toFixed(2).replace('.', ',') + ' €';
}

function applyCarColor(hex) {
  const panel = document.getElementById('car-preview');
  if (panel) panel.style.color = hex;
}

function showCarSilhouette(vehicleTypeId) {
  const panel = document.getElementById('car-preview');
  if (!panel) return;
  panel.innerHTML = CAR_SVGS[vehicleTypeId] || '';
  applyCarColor(state.vehicleColor);
  updateCarLabel();
}

function updateCarLabel() {
  const labelEl = document.getElementById('car-label');
  if (!labelEl) return;
  const vt = VEHICLE_TYPES.find(v => v.id === state.vehicleType);
  const typeLabel = vt ? vt.label : '';
  labelEl.textContent = typeLabel
    ? `O teu ${typeLabel} em ${state.colorLabel}`
    : '';
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

const STEP_LABELS = ['Problema', 'Veículo', 'Cor', 'Diagnóstico', 'Resultado'];

function updateProgressBar(step) {
  const segments = document.querySelectorAll('.cd-progress__segment');
  const labels = document.querySelectorAll('.cd-progress__labels span');
  segments.forEach((s, i) => s.classList.toggle('active', i < step));
  labels.forEach((l, i) => l.classList.toggle('active', i === step - 1));
}

// ─── Step navigation ──────────────────────────────────────────────────────────

function showStep(n, direction = 'forward') {
  const prev = state.currentStep;
  state.currentStep = n;

  document.querySelectorAll('.cd-step').forEach(el => el.classList.remove('active'));
  const next = document.getElementById(`step-${n}`);
  if (next) {
    next.classList.add('active');
    if (direction === 'forward') next.classList.add('cd-step-enter');
    requestAnimationFrame(() => next.classList.remove('cd-step-enter'));
  }
  updateProgressBar(n);

  // Show 3D panel from step 2 onwards on tablet/mobile
  const panel3d = document.querySelector('.cd-3d-panel');
  if (panel3d) panel3d.classList.toggle('visible', n >= 2);

  document.dispatchEvent(new CustomEvent('cardiagnose:step-changed', {
    detail: { from: prev, to: n },
    bubbles: true,
  }));
}

function validateStep(step) {
  switch (step) {
    case 1: return state.painCategory !== null;
    case 2: return state.vehicleType !== null;
    case 3: return true; // colour has a default
    case 4: return false; // handled by question flow
    default: return false;
  }
}

function goNext() {
  const step = state.currentStep;
  if (step === 4) return; // handled by question flow
  if (!validateStep(step)) return;
  showStep(step + 1);
}

function goBack() {
  const step = state.currentStep;
  if (step <= 1) return;
  // If moto and on step 5, go to step 3 (step 4 was skipped)
  const backTo = (state.motoClass !== null && step === 5) ? 3 : step - 1;
  showStep(backTo, 'back');
}

// ─── Step 1 — Pain Category ───────────────────────────────────────────────────

function renderStep1() {
  const container = document.getElementById('step-1');
  container.innerHTML = `
    <h2 class="cd-step__heading">O que te preocupa mais no teu carro?</h2>
    <p class="cd-step__sub">Escolhe a tua principal preocupação.</p>
    <div class="cd-pain-grid">
      ${PAIN_CATEGORIES.map(cat => `
        <div class="cd-pain-card ${state.painCategory === cat.id ? 'selected' : ''}"
             data-id="${cat.id}" role="button" tabindex="0"
             aria-pressed="${state.painCategory === cat.id}">
          <img class="cd-pain-card__icon"
               src="${cat.iconFile}" alt="${cat.title}"
               onerror="this.style.display='none'">
          <span class="cd-pain-card__title">${cat.title}</span>
          <span class="cd-pain-card__desc">${cat.description}</span>
        </div>
      `).join('')}
    </div>
    <nav class="cd-nav">
      <button class="cd-btn cd-btn--primary" id="btn-next-1"
              ${state.painCategory ? '' : 'disabled'}>
        Seguinte →
      </button>
    </nav>
  `;

  container.querySelectorAll('.cd-pain-card').forEach(card => {
    const activate = () => {
      state.painCategory = card.dataset.id;
      container.querySelectorAll('.cd-pain-card').forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
      container.querySelector('#btn-next-1').disabled = false;
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
  });

  container.querySelector('#btn-next-1').addEventListener('click', () => {
    if (state.painCategory) { renderStep2(); goNext(); }
  });
}

// ─── Step 2 — Vehicle Type ────────────────────────────────────────────────────

function renderStep2() {
  const container = document.getElementById('step-2');
  container.innerHTML = `
    <h2 class="cd-step__heading">Qual é o tipo do teu carro?</h2>
    <p class="cd-step__sub">Seleciona a categoria do teu veículo.</p>
    <div class="cd-vehicle-grid">
      ${VEHICLE_TYPES.map(vt => `
        <div class="cd-vehicle-card ${state.vehicleType === vt.id ? 'selected' : ''}"
             data-id="${vt.id}" role="button" tabindex="0"
             aria-pressed="${state.vehicleType === vt.id}">
          <img class="cd-vehicle-card__icon"
               src="icons/${vt.id}.svg" alt="${vt.label}"
               onerror="this.style.display='none'">
          <span class="cd-vehicle-card__label">${vt.label}</span>
        </div>
      `).join('')}
    </div>
    <div class="cd-brand-field">
      <label for="brand-input">Marca e modelo (opcional, ex: Peugeot 208)</label>
      <input id="brand-input" type="text" placeholder="Ex: Peugeot 208"
             value="${state.vehicleBrand}" maxlength="60">
    </div>
    <nav class="cd-nav">
      <button class="cd-btn cd-btn--ghost" id="btn-back-2">← Voltar</button>
      <button class="cd-btn cd-btn--primary" id="btn-next-2"
              ${state.vehicleType ? '' : 'disabled'}>
        Seguinte →
      </button>
    </nav>
  `;

  container.querySelectorAll('.cd-vehicle-card').forEach(card => {
    const activate = () => {
      state.vehicleType = card.dataset.id;
      // Load 3D model
      const vt = VEHICLE_TYPES.find(v => v.id === state.vehicleType);
      loadVehicleModel(vt);
      container.querySelectorAll('.cd-vehicle-card').forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
      container.querySelector('#btn-next-2').disabled = false;
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
  });

  container.querySelector('#brand-input').addEventListener('input', e => {
    state.vehicleBrand = e.target.value;
  });

  container.querySelector('#btn-back-2').addEventListener('click', () => goBack());
  container.querySelector('#btn-next-2').addEventListener('click', () => {
    if (state.vehicleType) { renderStep3(); goNext(); }
  });
}

function loadVehicleModel(vt) {
  showCarSilhouette(vt.id);
}

// ─── Step 3 — Colour ──────────────────────────────────────────────────────────

function renderStep3() {
  const vt = VEHICLE_TYPES.find(v => v.id === state.vehicleType);
  const container = document.getElementById('step-3');
  container.innerHTML = `
    <h2 class="cd-step__heading">Qual é a cor do teu carro?</h2>
    <p class="cd-step__sub">Vê o teu veículo ganhar cor em tempo real.</p>
    <div class="cd-color-grid">
      ${COLOR_PALETTE.map(c => `
        <div class="cd-color-swatch ${state.vehicleColor === c.hex ? 'selected' : ''}"
             style="background:${c.hex}"
             data-hex="${c.hex}" data-label="${c.label}"
             title="${c.label}" role="button" tabindex="0"
             aria-label="${c.label}"></div>
      `).join('')}
    </div>
    <div class="cd-color-custom">
      <input type="color" id="custom-color" value="${state.vehicleColor}"
             aria-label="Escolher outra cor">
      <span>Outra cor</span>
    </div>
    <p class="cd-color-label" id="color-label-text">
      ${vt ? `O teu ${vt.label} em ${state.colorLabel}` : state.colorLabel}
    </p>
    <nav class="cd-nav">
      <button class="cd-btn cd-btn--ghost" id="btn-back-3">← Voltar</button>
      <button class="cd-btn cd-btn--primary" id="btn-next-3">Seguinte →</button>
    </nav>
  `;

  function selectColor(hex, label) {
    state.vehicleColor = hex;
    state.colorLabel = label;
    container.querySelectorAll('.cd-color-swatch').forEach(s =>
      s.classList.toggle('selected', s.dataset.hex === hex));
    applyCarColor(hex);
    const lbl = container.querySelector('#color-label-text');
    const vtNow = VEHICLE_TYPES.find(v => v.id === state.vehicleType);
    if (lbl) lbl.textContent = vtNow ? `O teu ${vtNow.label} em ${label}` : label;
    updateCarLabel();
  }

  container.querySelectorAll('.cd-color-swatch').forEach(sw => {
    const go = () => selectColor(sw.dataset.hex, sw.dataset.label);
    sw.addEventListener('click', go);
    sw.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  container.querySelector('#custom-color').addEventListener('input', e => {
    selectColor(e.target.value, 'Cor personalizada');
    // Deselect palette swatches
    container.querySelectorAll('.cd-color-swatch').forEach(s => s.classList.remove('selected'));
  });

  container.querySelector('#btn-back-3').addEventListener('click', () => goBack());
  container.querySelector('#btn-next-3').addEventListener('click', () => {
    const isMoto = VEHICLE_TYPES.find(v => v.id === state.vehicleType)?.isMoto;
    if (isMoto) {
      state.motoClass = null;
      renderStep5Moto();
      showStep(5);
    } else {
      state.currentQuestionIndex = 0;
      state.diagnosticAnswers = [];
      state.totalScore = 0;
      renderStep4();
      showStep(4);
    }
  });
}

// ─── Step 4 — Diagnostic Questionnaire ───────────────────────────────────────

function renderStep4() {
  const cat = PAIN_CATEGORIES.find(c => c.id === state.painCategory);
  if (!cat) return;
  const questions = cat.questions;
  const idx = state.currentQuestionIndex;
  const q = questions[idx];
  const container = document.getElementById('step-4');

  container.innerHTML = `
    <p class="cd-question-progress">
      Pergunta <strong>${idx + 1}</strong> de <strong>${questions.length}</strong>
    </p>
    <p class="cd-question-text">${q.text}</p>
    <div class="cd-options">
      ${q.options.map((opt, i) => `
        <button class="cd-option" data-score="${opt.score}" data-idx="${i}"
                aria-label="${opt.label}">
          ${opt.label}
        </button>
      `).join('')}
    </div>
    <nav class="cd-nav">
      <button class="cd-btn cd-btn--ghost" id="btn-back-4">← Voltar</button>
    </nav>
  `;

  container.querySelectorAll('.cd-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const score = parseInt(btn.dataset.score, 10);
      // Store answer (replace if already answered)
      const existing = state.diagnosticAnswers.findIndex(a => a.questionId === q.id);
      if (existing >= 0) {
        state.totalScore -= state.diagnosticAnswers[existing].score;
        state.diagnosticAnswers[existing] = { questionId: q.id, score };
      } else {
        state.diagnosticAnswers.push({ questionId: q.id, score });
      }
      state.totalScore += score;

      if (idx + 1 < questions.length) {
        state.currentQuestionIndex = idx + 1;
        renderStep4();
      } else {
        // All questions answered — compute recommendation
        state.recommendation = recommend(
          state.painCategory,
          state.totalScore,
          state.vehicleType
        );
        renderStep5();
        showStep(5);
      }
    });
  });

  container.querySelector('#btn-back-4').addEventListener('click', () => {
    if (state.currentQuestionIndex > 0) {
      // Remove last answer
      const lastQ = questions[state.currentQuestionIndex - 1];
      const existing = state.diagnosticAnswers.findIndex(a => a.questionId === lastQ.id);
      if (existing >= 0) {
        state.totalScore -= state.diagnosticAnswers[existing].score;
        state.diagnosticAnswers.splice(existing, 1);
      }
      state.currentQuestionIndex -= 1;
      renderStep4();
    } else {
      goBack(); // goes to step 3
    }
  });
}

// ─── Step 5 — Recommendation Result ──────────────────────────────────────────

function renderStep5() {
  const rec = state.recommendation;
  if (!rec) return;
  const container = document.getElementById('step-5');
  const { primaryPack: p, alternativePack: alt, finalPrice, surchargeApplied,
          justification, installmentAmount } = rec;
  const priceRange = p.priceMax > p.priceMin
    ? `${fmt(finalPrice)} a ${fmt(p.priceMax + (surchargeApplied ? 5 : 0))}`
    : fmt(finalPrice);

  container.innerHTML = `
    <p class="cd-result-intro">
      Com base nas tuas respostas, o pack ideal para o teu
      ${state.vehicleBrand || VEHICLE_TYPES.find(v => v.id === state.vehicleType)?.label || 'veículo'} é:
    </p>

    <div class="cd-result-card primary">
      <span class="cd-result-badge gold">🏆 Recomendação Principal</span>
      <div class="cd-result-pack-name">${p.name}</div>
      <div class="cd-result-price">${priceRange}</div>
      ${surchargeApplied ? `<div class="cd-result-surcharge">Inclui taxa SUV/Carrinha +5,00 €</div>` : ''}
      <ul class="cd-result-items">
        ${p.includedItems.map(item => `<li>${item}</li>`).join('')}
      </ul>
      <p class="cd-result-justification">${justification}</p>
      ${installmentAmount ? `
        <div class="cd-installment">
          💳 Disponível desde <strong>4× de ${fmt(installmentAmount)} sem juros</strong> — solicita na marcação.
        </div>
      ` : ''}
      <button class="cd-btn cd-btn--cta" id="btn-book-primary">
        Marcar agora — ${p.name}
      </button>
    </div>

    <div class="cd-result-card alt">
      <span class="cd-result-badge grey">⭐ Opção Alternativa</span>
      <div class="cd-result-pack-name">${alt.name}</div>
      <div class="cd-result-price">${alt.priceMax > alt.priceMin ? `${fmt(alt.priceMin)} a ${fmt(alt.priceMax)}` : fmt(alt.priceMin)}</div>
      <button class="cd-btn cd-btn--cta-alt" id="btn-book-alt">
        Marcar com ${alt.name}
      </button>
    </div>

    <p class="cd-contact">
      Tens dúvidas? Liga: <strong>96 44 550 06</strong> ou envia DM no Instagram.
    </p>
    <button class="cd-restart" id="btn-restart">Recomeçar o diagnóstico</button>
  `;

  container.querySelector('#btn-book-primary').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('cardiagnose:booking-clicked', {
      detail: { packId: p.id, packName: p.name, finalPrice },
      bubbles: true,
    }));
    window.open(p.bookingUrl, '_blank', 'noopener,noreferrer');
  });

  container.querySelector('#btn-book-alt').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('cardiagnose:booking-clicked', {
      detail: { packId: alt.id, packName: alt.name, finalPrice: alt.priceMin },
      bubbles: true,
    }));
    window.open(alt.bookingUrl, '_blank', 'noopener,noreferrer');
  });

  container.querySelector('#btn-restart').addEventListener('click', resetWidget);

  document.dispatchEvent(new CustomEvent('cardiagnose:recommendation-shown', {
    detail: {
      packId: p.id,
      packName: p.name,
      score: state.totalScore,
      painCategory: state.painCategory,
    },
    bubbles: true,
  }));
}

// ─── Step 5 — Motorcycle Result ───────────────────────────────────────────────

function renderStep5Moto() {
  const container = document.getElementById('step-5');
  container.innerHTML = `
    <p class="cd-result-intro">Lavagem completa para a tua mota:</p>
    <div class="cd-moto-options">
      ${MOTO_OPTIONS.map((opt, i) => `
        <div class="cd-moto-option" data-idx="${i}" role="button" tabindex="0">
          <div class="cd-moto-option__label">${opt.label}</div>
          <div class="cd-moto-option__price">${fmt(opt.price)}</div>
        </div>
      `).join('')}
    </div>
    <div class="cd-result-card primary" style="margin-top:0">
      <span class="cd-result-badge gold">Inclui</span>
      <ul class="cd-result-items">
        ${MOTO_INCLUDES.map(item => `<li>${item}</li>`).join('')}
      </ul>
      <button class="cd-btn cd-btn--cta" id="btn-book-moto">
        Marcar agora — Lavagem Completa Mota
      </button>
    </div>
    <p class="cd-contact">
      Tens dúvidas? Liga: <strong>96 44 550 06</strong> ou envia DM no Instagram.
    </p>
    <button class="cd-restart" id="btn-restart-moto">Recomeçar o diagnóstico</button>
  `;

  container.querySelectorAll('.cd-moto-option').forEach(opt => {
    opt.addEventListener('click', () => {
      container.querySelectorAll('.cd-moto-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.motoClass = MOTO_OPTIONS[parseInt(opt.dataset.idx)].label;
    });
  });

  container.querySelector('#btn-book-moto').addEventListener('click', () => {
    window.open('https://imperiodalavagemauto.buk.pt', '_blank', 'noopener,noreferrer');
  });

  container.querySelector('#btn-restart-moto').addEventListener('click', resetWidget);
}

// ─── Restart ──────────────────────────────────────────────────────────────────

function resetWidget() {
  // Reset state (keep vehicleBrand for convenience)
  const brand = state.vehicleBrand;
  Object.assign(state, {
    currentStep: 1,
    painCategory: null,
    vehicleType: null,
    vehicleBrand: brand,
    vehicleColor: '#8A8A8A',
    colorLabel: 'Cinzento',
    diagnosticAnswers: [],
    currentQuestionIndex: 0,
    totalScore: 0,
    recommendation: null,
    motoClass: null,
  });

  // Reset car preview
  const panel = document.getElementById('car-preview');
  if (panel) { panel.innerHTML = ''; panel.style.color = ''; }

  renderStep1();
  showStep(1);

  document.dispatchEvent(new CustomEvent('cardiagnose:restarted', { bubbles: true }));
}

// ─── Build HTML shell ─────────────────────────────────────────────────────────

function buildShell() {
  root.innerHTML = `
    <header class="cd-header">
      <span class="cd-header__logo">Império da Lavagem</span>
      <span class="cd-header__title">CarDiagnose — encontra o teu pack ideal</span>
    </header>

    <div class="cd-progress">
      <div class="cd-progress__track">
        ${[1,2,3,4,5].map(n => `<div class="cd-progress__segment" data-step="${n}"></div>`).join('')}
      </div>
      <div class="cd-progress__labels">
        ${STEP_LABELS.map(l => `<span>${l}</span>`).join('')}
      </div>
    </div>

    <div class="cd-body">
      <div class="cd-form-panel">
        <div id="step-1" class="cd-step"></div>
        <div id="step-2" class="cd-step"></div>
        <div id="step-3" class="cd-step"></div>
        <div id="step-4" class="cd-step"></div>
        <div id="step-5" class="cd-step"></div>
      </div>

      <div class="cd-3d-panel">
        <div id="car-preview" class="cd-car-preview" aria-label="Silhueta do veículo seleccionado"></div>
        <p class="cd-car-label" id="car-label"></p>
      </div>
    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

buildShell();
renderStep1();
showStep(1);
