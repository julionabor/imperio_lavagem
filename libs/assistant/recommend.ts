/**
 * Motor de recomendação do assistente guiado.
 *
 * Porta de recommend() do protótipo adaptada para trabalhar com:
 * - preços em cêntimos
 * - parâmetros configuráveis (regras de pontuação via AssistantStep)
 * - stock real (lista de viaturas injetada, sem acesso direto a dados)
 *
 * Fonte: prototype-logic.js + SPEC §4.2 RF-P15.
 */

import { calcMonthlyPayment, taegToMonthlyRate } from '../finance/calc.ts';
import type { AssistantAnswers } from '../contracts/lead.ts';

export type { AssistantAnswers };

// ── Tipos ──────────────────────────────────────────────────────────────────

/** Subconjunto de Vehicle necessário para a pontuação. */
export interface RecommendVehicle {
  id: string;
  priceCents: number;
  fuel: string;   // valor display: 'Diesel', 'Gasolina', 'Híbrido', 'Plug-in', 'Elétrico'
  bodyType: string; // valor display: 'SUV', 'Carrinha', 'Berlina', 'Utilitário', 'Coupé'
}

export interface RecommendResult {
  /** IDs das viaturas recomendadas (máx. 3) */
  ids: string[];
  /** true se todas cabem no orçamento; false se são as mais próximas */
  exact: boolean;
}

// ── Parâmetros do protótipo ────────────────────────────────────────────────

/** TAEG usada para calcular a prestação no assistente (protótipo: 15 %). */
const RECOMMEND_TAEG_BP = 1500;
/** Prazo padrão do protótipo. */
const RECOMMEND_TERM = 96;
/** Entrada padrão. */
const RECOMMEND_ENTRY = 0;

const MONTHLY_RATE = taegToMonthlyRate(RECOMMEND_TAEG_BP);

/** Converte o label de orçamento para prestação máxima em cêntimos. */
function orcToMaxCents(orc: string): number {
  if (orc === 'Até 300 €') return 30000;    // 300 €
  if (orc === '300 a 450 €') return 45000;  // 450 €
  return Infinity;
}

// ── Pontuação ─────────────────────────────────────────────────────────────

function score(car: RecommendVehicle, ans: AssistantAnswers): number {
  let sc = 0;

  // combustível (3 pontos — match exacto)
  if (ans.fuel === 'Diesel' && car.fuel === 'Diesel') sc += 3;
  if (ans.fuel === 'Gasolina' && car.fuel === 'Gasolina') sc += 3;
  if (ans.fuel === 'Elétrico' && car.fuel === 'Elétrico') sc += 3;
  if (ans.fuel === 'Híbrido ou plug-in' && (car.fuel === 'Híbrido' || car.fuel === 'Plug-in'))
    sc += 3;

  // família (2 pontos por SUV/Carrinha quando há mais de 2 pessoas)
  if (ans.fam !== 'Só eu ou a dois' && (car.bodyType === 'SUV' || car.bodyType === 'Carrinha'))
    sc += 2;

  // família grande prefere Carrinha (+1 bónus)
  if (ans.fam === 'Família e muita bagagem' && car.bodyType === 'Carrinha') sc += 1;

  // uso cidade (2 pontos para utilitários, elétricos e híbridos)
  if (
    ans.uso === 'Cidade' &&
    (car.bodyType === 'Utilitário' || car.fuel === 'Elétrico' || car.fuel === 'Híbrido')
  )
    sc += 2;

  // uso autoestrada (1 ponto para diesel, carrinhas e berlinas)
  if (
    ans.uso === 'Autoestrada' &&
    (car.fuel === 'Diesel' || car.bodyType === 'Carrinha' || car.bodyType === 'Berlina')
  )
    sc += 1;

  return sc;
}

// ── recommend ─────────────────────────────────────────────────────────────

/**
 * Seleciona as 3 viaturas mais adequadas às respostas do assistente.
 *
 * 1. Calcula a prestação de cada viatura (TAEG 15 %, sem entrada, 96 meses).
 * 2. Filtra as que cabem no orçamento.
 * 3. Ordena por pontuação desc, depois por prestação asc.
 * 4. Se nenhuma cabe, usa as 6 mais baratas como pool alternativa.
 *
 * @param cars   - Stock disponível (PUBLISHED)
 * @param ans    - Respostas do utilizador
 */
export function recommend(cars: RecommendVehicle[], ans: AssistantAnswers): RecommendResult {
  const max = orcToMaxCents(ans.orc);

  const scored = cars.map((c) => {
    const monthly = calcMonthlyPayment(c.priceCents, RECOMMEND_ENTRY, RECOMMEND_TERM, MONTHLY_RATE);
    return { c, monthly, sc: score(c, ans), fits: monthly <= max };
  });

  let pool = scored.filter((x) => x.fits);
  const exact = pool.length > 0;

  if (!exact) {
    // Sem viaturas no orçamento: mostra as 6 mais baratas
    pool = scored.slice().sort((a, b) => a.monthly - b.monthly).slice(0, 6);
  }

  pool.sort((a, b) => b.sc - a.sc || a.monthly - b.monthly);

  return {
    ids: pool.slice(0, 3).map((x) => x.c.id),
    exact,
  };
}
