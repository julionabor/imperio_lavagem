/**
 * CarDiagnose Widget — Main Application
 * Império da Lavagem Auto
 *
 * ES6 module — no build step required.
 * Runs at: cardiagnose/index.html
 */

import { PAIN_CATEGORIES, VEHICLE_TYPES, COLOR_PALETTE } from './data/questions.js';
import { recommend, MOTO_OPTIONS, MOTO_INCLUDES } from './data/packs.js';

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

function hexToHueRotation(hex) {
  // Convert hex to RGB then to HSL; return hue in degrees.
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  // Base model hue is grey (≈0°). Rotate to target hue.
  return Math.round(h * 360);
}

function applyColorFilter(hex) {
  const mv = document.getElementById('car3d');
  if (!mv) return;
  const hue = hexToHueRotation(hex);
  // Neutral colours (grey, silver, white, black) — reduce saturation boost
  const sat = ['#8A8A8A', '#C0C0C0', '#F5F5F5', '#1A1A1A'].includes(hex) ? 1 : 1.4;
  mv.style.filter = `hue-rotate(${hue}deg) saturate(${sat})`;
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
  const mv = document.getElementById('car3d');
  if (!mv) return;
  mv.setAttribute('src', vt.modelFile);
  mv.setAttribute('poster', `icons/${vt.id}.svg`);
  applyColorFilter(state.vehicleColor);
  updateCarLabel();
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
    applyColorFilter(hex);
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
          💳 Disponível em <strong>4× de ${fmt(installmentAmount)} sem juros</strong> — solicita na marcação.
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

  // Reset 3D model
  const mv = document.getElementById('car3d');
  if (mv) {
    mv.removeAttribute('src');
    mv.style.filter = '';
  }

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
        <model-viewer
          id="car3d"
          auto-rotate
          camera-controls
          shadow-intensity="0.5"
          exposure="0.8"
          ar-modes="none"
          style="width:100%;height:320px;background:transparent;--poster-color:transparent"
          aria-label="Modelo 3D do veículo seleccionado">
        </model-viewer>
        <p class="cd-car-label" id="car-label"></p>
      </div>
    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

buildShell();
renderStep1();
showStep(1);
