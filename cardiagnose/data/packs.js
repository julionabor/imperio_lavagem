/** @module packs
 * Service pack catalogue and recommendation engine for CarDiagnose widget.
 * Decision tree maps (painCategory × totalScore) → recommended pack.
 * Commercial rule: principal-tier packs must cover ≥75% of outcomes.
 */

const BOOKING_URL = 'https://imperiodalavagemauto.buk.pt';

export const PACKS = {
  diamanteExclusive: {
    id: 'diamanteExclusive',
    name: 'Pack Diamante Exclusive',
    priceMin: 400,
    priceMax: 400,
    tier: 'principal',
    excludesSurcharge: true,
    includedItems: [
      'Polimento profissional completo',
      'Vitrificação nano-cerâmica 2 anos',
      'Pack Zero Km incluído',
      'Higienização Premium incluída',
      'Protecção máxima interior e exterior',
    ],
    installments: true,
    bookingUrl: BOOKING_URL,
  },
  diamantePlus: {
    id: 'diamantePlus',
    name: 'Pack Diamante Plus',
    priceMin: 360,
    priceMax: 360,
    tier: 'principal',
    excludesSurcharge: true,
    includedItems: [
      'Polimento profissional',
      'Vitrificação nano-cerâmica 2 anos',
      'Higienização Premium incluída',
      'Protecção completa interior + exterior',
    ],
    installments: true,
    bookingUrl: BOOKING_URL,
  },
  diamante: {
    id: 'diamante',
    name: 'Pack Diamante',
    priceMin: 300,
    priceMax: 330,
    tier: 'principal',
    excludesSurcharge: true,
    includedItems: [
      'Polimento profissional',
      'Vitrificação nano-cerâmica 2 anos',
      'Protecção contra riscos leves',
      'Repelência de água e UV',
      'Alto brilho duradouro',
    ],
    installments: true,
    bookingUrl: BOOKING_URL,
  },
  higienizacaoPremium: {
    id: 'higienizacaoPremium',
    name: 'Higienização Premium',
    priceMin: 100,
    priceMax: 100,
    tier: 'principal',
    includedItems: [
      'Lavagem completa exterior',
      'Lavagem de estofos',
      'Desinfeção por ozono premium',
      'Renovação plásticos (interior 6 meses / exterior 60 dias)',
      'Volante, cintos e palas de sol',
    ],
    installments: true,
    bookingUrl: BOOKING_URL,
  },
  higienizacaoStandard: {
    id: 'higienizacaoStandard',
    name: 'Higienização Standard',
    priceMin: 40,
    priceMax: 40,
    tier: 'principal',
    includedItems: [
      'Pré-lavagem e lavagem manual exterior',
      'Descontaminação férrea',
      'Aspiração profunda',
      'Lavagem de plásticos e tapetes',
      'Tratamento de ozono e abrilhantador de pneus',
    ],
    installments: false,
    bookingUrl: BOOKING_URL,
  },
  brilhoProtecao: {
    id: 'brilhoProtecao',
    name: 'Pack Brilho & Proteção 1 ano',
    priceMin: 240,
    priceMax: 270,
    tier: 'secundario',
    excludesSurcharge: true,
    includedItems: [
      'Polimento suave',
      'Vitrificação 1 ano',
      'Repelência de água',
      'Brilho intenso duradouro',
    ],
    installments: true,
    bookingUrl: BOOKING_URL,
  },
  polimento: {
    id: 'polimento',
    name: 'Polimento Isolado',
    priceMin: 140,
    priceMax: 160,
    tier: 'secundario',
    excludesSurcharge: true,
    includedItems: [
      'Polimento profissional por secções',
      'Remoção de micro-riscos',
      'Recuperação do brilho original',
    ],
    installments: true,
    bookingUrl: BOOKING_URL,
  },
  packZeroKm: {
    id: 'packZeroKm',
    name: 'Pack Zero Km',
    priceMin: 130,
    priceMax: 130,
    tier: 'secundario',
    includedItems: [
      'Descontaminação completa interior',
      'Higienização profunda de estofos',
      'Tratamento plásticos interiores',
      'Abrilhantador de vidros',
    ],
    installments: true,
    bookingUrl: BOOKING_URL,
  },
  tratamentoOzono: {
    id: 'tratamentoOzono',
    name: 'Tratamento de Ozono',
    priceMin: 20,
    priceMax: 20,
    tier: 'residual',
    includedItems: [
      'Tratamento de ozono profissional',
      'Eliminação de odores na fonte',
    ],
    installments: false,
    bookingUrl: BOOKING_URL,
  },
  lavagBasica: {
    id: 'lavagBasica',
    name: 'Lavagem Básica',
    priceMin: 25,
    priceMax: 25,
    tier: 'residual',
    includedItems: [
      'Lavagem manual exterior',
      'Aspiração rápida',
      'Abrilhantador de pneus',
    ],
    installments: false,
    bookingUrl: BOOKING_URL,
  },
  higienizacaoInterior: {
    id: 'higienizacaoInterior',
    name: 'Higienização Apenas Interior',
    priceMin: 30,
    priceMax: 30,
    tier: 'residual',
    includedItems: [
      'Aspiração profunda',
      'Limpeza de plásticos e tapetes',
      'Tratamento de ozono básico',
    ],
    installments: false,
    bookingUrl: BOOKING_URL,
  },
  vitrificacao: {
    id: 'vitrificacao',
    name: 'Vitrificação 1 ano',
    priceMin: 160,
    priceMax: 160,
    tier: 'secundario',
    includedItems: [
      'Vitrificação 1 ano',
      'Repelência de água',
      'Protecção UV',
    ],
    installments: true,
    bookingUrl: BOOKING_URL,
  },
};

// ─── Justification templates ──────────────────────────────────────────────────

const JUSTIFICATIONS = {
  exterior: {
    higienizacaoStandard: 'Sujidade acumulada e exposição regular ao exterior — o Standard faz uma descontaminação completa e devolve o carro em condições.',
    higienizacaoPremium: 'Com o nível de exposição e degradação exterior que descreveste, o Premium protege também os plásticos por até 60 dias.',
  },
  interior: {
    higienizacaoStandard: 'Aspiração profunda, plásticos e tapetes — o Standard resolve o interior em condições.',
    higienizacaoPremium: 'Com manchas nos estofos e sujidade incrustada, o Premium lava os estofos e faz desinfeção por ozono.',
  },
  odor: {
    higienizacaoStandard: 'O Standard inclui tratamento de ozono — suficiente para odores leves e recentes.',
    higienizacaoPremium: 'Cheiro persistente de tabaco, animais ou mofo precisa do ozono premium — elimina na fonte, não mascara.',
  },
  riscos: {
    brilhoProtecao: 'Riscos leves — polimento + vitrificação 1 ano devolve o brilho e protege a pintura por 12 meses.',
    diamante: 'Com riscos visíveis ao sol e histórico sem polimento, a nano-cerâmica 2 anos do Diamante é o tratamento certo para restaurar e proteger.',
  },
  protecao: {
    brilhoProtecao: 'Protecção de 1 ano — ideal para o dia-a-dia com manutenção regular.',
    diamante: 'Exposição frequente a agressões ambientais e intenção de valorizar o carro pedem a nano-cerâmica 2 anos do Diamante.',
  },
  completo: {
    higienizacaoPremium: 'Para uma renovação completa a começar pelo interior, o Premium cobre tudo — estofos, plásticos, ozono.',
    diamantePlus: 'Interior + exterior + protecção 2 anos: o Diamante Plus inclui polimento, nano-cerâmica e Higienização Premium.',
    diamanteExclusive: 'A renovação total que o teu carro merece: nano-cerâmica 2 anos + Pack Zero Km incluído.',
  },
};

// ─── Decision tree ────────────────────────────────────────────────────────────

const DECISION_TREE = {
  exterior(score) {
    if (score <= 8) return { primary: PACKS.higienizacaoStandard, alt: PACKS.lavagBasica };
    return { primary: PACKS.higienizacaoPremium, alt: PACKS.higienizacaoStandard };
  },
  interior(score) {
    if (score <= 6) return { primary: PACKS.higienizacaoStandard, alt: PACKS.higienizacaoInterior };
    return { primary: PACKS.higienizacaoPremium, alt: PACKS.higienizacaoStandard };
  },
  odor(score) {
    if (score <= 4) return { primary: PACKS.higienizacaoStandard, alt: PACKS.tratamentoOzono };
    return { primary: PACKS.higienizacaoPremium, alt: PACKS.higienizacaoStandard };
  },
  riscos(score) {
    if (score <= 6) return { primary: PACKS.brilhoProtecao, alt: PACKS.polimento };
    return { primary: PACKS.diamante, alt: PACKS.brilhoProtecao };
  },
  protecao(score) {
    if (score <= 5) return { primary: PACKS.brilhoProtecao, alt: PACKS.vitrificacao };
    return { primary: PACKS.diamante, alt: PACKS.brilhoProtecao };
  },
  completo(score) {
    if (score <= 5) return { primary: PACKS.higienizacaoPremium, alt: PACKS.packZeroKm };
    if (score <= 7) return { primary: PACKS.diamantePlus, alt: PACKS.higienizacaoPremium };
    return { primary: PACKS.diamanteExclusive, alt: PACKS.diamantePlus };
  },
};

// ─── Motorcycle lookup ────────────────────────────────────────────────────────

export const MOTO_OPTIONS = [
  { label: 'Mota até 125 cc', price: 25, desc: 'Lavagem Completa Mota (até 125 cc)' },
  { label: 'Mota acima de 125 cc', price: 30, desc: 'Lavagem Completa Mota (acima de 125 cc)' },
];

export const MOTO_INCLUDES = [
  'Pré-lavagem',
  'Jantes e pneus',
  'Carenagens e motor',
  'Plásticos e estofos',
  'Cera + WD na corrente',
];

// ─── Main recommend function ──────────────────────────────────────────────────

/**
 * @param {string} painCategoryId
 * @param {number} totalScore
 * @param {string} vehicleTypeId
 * @returns {{ primaryPack, alternativePack, finalPrice, surchargeApplied, justification, installmentAmount }}
 */
export function recommend(painCategoryId, totalScore, vehicleTypeId) {
  const surchargeTypes = ['suv', 'carrinha', 'monovolume'];
  const baseSurcharge = surchargeTypes.includes(vehicleTypeId) ? 5.00 : 0;

  const treeResult = DECISION_TREE[painCategoryId]?.(totalScore);
  if (!treeResult) {
    // Fallback — should never happen with valid input
    const fb = PACKS.higienizacaoStandard;
    const fbSurcharge = fb.excludesSurcharge ? 0 : baseSurcharge;
    return {
      primaryPack: fb,
      alternativePack: PACKS.lavagBasica,
      finalPrice: fb.priceMin + fbSurcharge,
      surchargeApplied: fbSurcharge > 0,
      justification: 'Com base nas tuas respostas, o Standard é o pack ideal para ti.',
      installmentAmount: null,
    };
  }

  const { primary, alt } = treeResult;
  const effectiveSurcharge = primary.excludesSurcharge ? 0 : baseSurcharge;
  const finalPrice = primary.priceMin + effectiveSurcharge;
  const justification = JUSTIFICATIONS[painCategoryId]?.[primary.id]
    ?? `O ${primary.name} é o pack ideal para o teu caso.`;
  const installmentAmount = primary.installments && finalPrice >= 100
    ? Math.ceil((finalPrice / 4) * 100) / 100
    : null;

  return {
    primaryPack: primary,
    alternativePack: alt,
    finalPrice,
    surchargeApplied: effectiveSurcharge > 0,
    justification,
    installmentAmount,
  };
}
