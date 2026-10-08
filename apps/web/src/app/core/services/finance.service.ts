import { Injectable } from '@angular/core';
import {
  calcFinancingTaeg,
  calcFinancingTan,
  taegToMonthlyRate,
  monthlyRateToImpliedTanBp,
  type FinancingCalcResult,
} from '@pm/libs/finance';
import type { FinancingProduct } from '@pm/libs/contracts';

export interface SimulationResult extends FinancingCalcResult {
  tanBp: number;
  taegBp: number;
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  simulate(
    product: FinancingProduct,
    priceCents: number,
    downCents: number,
    termMonths: number,
  ): SimulationResult {
    if (product.rateMode === 'TAEG_INPUT') {
      const result = calcFinancingTaeg(priceCents, downCents, termMonths, product.taegBp);
      const impliedRate = taegToMonthlyRate(product.taegBp);
      return {
        ...result,
        tanBp: monthlyRateToImpliedTanBp(impliedRate),
        taegBp: product.taegBp,
      };
    } else {
      const result = calcFinancingTan(priceCents, downCents, termMonths, product.tanBp);
      return {
        ...result,
        tanBp: product.tanBp,
        taegBp: product.taegBp,
      };
    }
  }

  /** Verifica se a viatura cabe (ou fica perto) do orçamento mensal */
  budgetStatus(
    product: FinancingProduct,
    priceCents: number,
    downCents: number,
    termMonths: number,
    budgetMonthlyCents: number,
  ): 'fits' | 'near' | 'over' {
    const { monthlyPaymentRounded } = this.simulate(product, priceCents, downCents, termMonths);
    if (monthlyPaymentRounded <= budgetMonthlyCents) return 'fits';
    const nearLimit = Math.round(budgetMonthlyCents * (1 + (product.budgetNearPct ?? 15) / 100));
    if (monthlyPaymentRounded <= nearLimit) return 'near';
    return 'over';
  }
}
