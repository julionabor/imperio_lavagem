import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { FinancingAdminApi, type SimulateResponse } from './financing-admin.api';
import { PmButton } from '../../shared/ui/pm-button/pm-button';
import { PmInput } from '../../shared/ui/pm-input/pm-input';
import { ToastService } from '../../shared/ui/pm-toast/pm-toast';
import { formatEur, formatBp } from '../../shared/util/format';

@Component({
  selector: 'pm-financing-form-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, PmButton, PmInput],
  template: `
    <div class="mx-auto max-w-3xl">
      <div class="mb-6 flex items-center gap-3">
        <a routerLink="/admin/financiamento" class="text-ink-400 hover:text-ink-200">←</a>
        <h1 class="font-display text-h2 font-semibold text-ink-100">
          {{ isNew() ? 'Novo produto' : 'Editar produto' }}
        </h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSave()" class="space-y-6">
        <!-- Identificação -->
        <section class="rounded-xl border border-ink-800 bg-ink-900 p-5 space-y-4">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-ink-400">Identificação</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <pm-input label="Nome do produto *" formControlName="name" placeholder="Crédito Auto Padrão" />
            <pm-input label="Financeira *" formControlName="lenderName" placeholder="Banco Exemplo" />
          </div>
          <div class="flex gap-4">
            <div class="flex items-center gap-2">
              <input type="checkbox" id="active" formControlName="active" class="h-4 w-4 accent-red-500" />
              <label for="active" class="text-sm text-ink-200">Ativo</label>
            </div>
          </div>
        </section>

        <!-- Taxa -->
        <section class="rounded-xl border border-ink-800 bg-ink-900 p-5 space-y-4">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-ink-400">Taxa</h2>
          <div>
            <label class="mb-2 block text-sm font-medium text-ink-300">Modo de cálculo</label>
            <div class="flex gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" formControlName="rateMode" value="TAEG_INPUT" class="accent-red-500" />
                <span class="text-sm text-ink-200">TAEG direta (protótipo)</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" formControlName="rateMode" value="TAN_AND_FEES" class="accent-red-500" />
                <span class="text-sm text-ink-200">TAN + encargos</span>
              </label>
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">
                TAEG (%) {{ form.get('rateMode')?.value === 'TAEG_INPUT' ? '*' : '' }}
              </label>
              <input type="number" step="0.01" formControlName="taegPct" placeholder="15.00"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">
                TAN (%) {{ form.get('rateMode')?.value === 'TAN_AND_FEES' ? '*' : '' }}
              </label>
              <input type="number" step="0.01" formControlName="tanPct" placeholder="12.50"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none" />
            </div>
          </div>
        </section>

        <!-- Prazos e entrada -->
        <section class="rounded-xl border border-ink-800 bg-ink-900 p-5 space-y-4">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-ink-400">Prazos e entrada</h2>
          <div class="grid gap-4 sm:grid-cols-3">
            <pm-input label="Prazo padrão (meses)" type="number" formControlName="defaultTermMonths" />
            <pm-input label="Entrada padrão (%)" type="number" formControlName="defaultDownPaymentPct" />
            <pm-input label="Entrada máx. (%)" type="number" formControlName="maxDownPaymentPct" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-ink-300">Prazos disponíveis</label>
            <div class="flex flex-wrap gap-2">
              @for (t of allTerms; track t) {
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" [checked]="isTermSelected(t)" (change)="toggleTerm(t)" class="h-4 w-4 accent-red-500" />
                  <span class="text-sm text-ink-300">{{ t }}m</span>
                </label>
              }
            </div>
          </div>
        </section>

        <!-- Encargos -->
        <section class="rounded-xl border border-ink-800 bg-ink-900 p-5 space-y-4">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-ink-400">Encargos</h2>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Comissão abertura (€)</label>
              <input type="number" step="0.01" formControlName="openingFeeEur" placeholder="0"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Encargo mensal (€)</label>
              <input type="number" step="0.01" formControlName="monthlyFeeEur" placeholder="0"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Imp. do selo (%)</label>
              <input type="number" step="0.001" formControlName="stampDutyPct" placeholder="0.60"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Mín. financiado (€)</label>
              <input type="number" step="100" formControlName="minFinancedEur" placeholder="3000"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Máx. financiado (€)</label>
              <input type="number" step="100" formControlName="maxFinancedEur" placeholder="100000"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Idade máx. viatura (anos)</label>
              <input type="number" formControlName="maxVehicleAgeAtEndYears" placeholder="15"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none" />
            </div>
          </div>
        </section>

        <!-- Simulador de teste -->
        <section class="rounded-xl border border-ink-800 bg-ink-900 p-5 space-y-4">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-ink-400">Simulador de teste</h2>
          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Preço da viatura (€)</label>
              <input type="number" [(ngModel)]="simPrice" [ngModelOptions]="{standalone: true}" placeholder="24900"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Entrada (€)</label>
              <input type="number" [(ngModel)]="simEntry" [ngModelOptions]="{standalone: true}" placeholder="0"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Prazo (meses)</label>
              <input type="number" [(ngModel)]="simTerm" [ngModelOptions]="{standalone: true}" placeholder="96"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none" />
            </div>
          </div>
          <pm-button variant="secondary" size="sm" [loading]="simLoading()" (click)="runSimulation()">Simular</pm-button>

          @if (simResult(); as r) {
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div class="rounded-lg bg-ink-850 p-3">
                <p class="text-xs text-ink-500">Prestação</p>
                <p class="text-lg font-semibold text-ink-100">{{ formatEur(r.monthlyPaymentCents) }}</p>
              </div>
              <div class="rounded-lg bg-ink-850 p-3">
                <p class="text-xs text-ink-500">TAEG</p>
                <p class="text-lg font-semibold text-ink-100">{{ formatBp(r.taegBp) }}</p>
              </div>
              <div class="rounded-lg bg-ink-850 p-3">
                <p class="text-xs text-ink-500">MTIC</p>
                <p class="text-lg font-semibold text-ink-100">{{ formatEur(r.mticCents) }}</p>
              </div>
              <div class="rounded-lg bg-ink-850 p-3">
                <p class="text-xs text-ink-500">Juros totais</p>
                <p class="text-lg font-semibold text-ink-100">{{ formatEur(r.interestCents) }}</p>
              </div>
            </div>
          }
        </section>

        <div class="flex justify-end gap-3">
          <pm-button variant="secondary" routerLink="/admin/financiamento">Cancelar</pm-button>
          <pm-button type="submit" [loading]="saving()">Guardar</pm-button>
        </div>
      </form>
    </div>
  `,
})
export class FinancingFormPage implements OnInit {
  private readonly api = inject(FinancingAdminApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly isNew = signal(false);
  protected readonly saving = signal(false);
  protected readonly simLoading = signal(false);
  protected readonly simResult = signal<SimulateResponse | null>(null);
  protected simPrice = 24900;
  protected simEntry = 0;
  protected simTerm = 96;
  protected readonly formatEur = formatEur;
  protected readonly formatBp = formatBp;

  protected readonly allTerms = [24, 36, 48, 60, 72, 84, 96];
  protected readonly selectedTerms = signal(new Set([24, 36, 48, 60, 72, 84, 96]));

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    lenderName: ['', Validators.required],
    active: [true],
    rateMode: ['TAEG_INPUT'],
    taegPct: [15],
    tanPct: [0],
    defaultTermMonths: [96],
    defaultDownPaymentPct: [0],
    maxDownPaymentPct: [50],
    openingFeeEur: [0],
    monthlyFeeEur: [0],
    stampDutyPct: [0.6],
    minFinancedEur: [3000],
    maxFinancedEur: [100000],
    maxVehicleAgeAtEndYears: [null as number | null],
    budgetNearPct: [15],
    representativeExampleTemplate: [''],
    legalNote: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isNew.set(!id || id === 'novo');
    if (!this.isNew()) {
      this.loadProduct(id!);
    }
  }

  private async loadProduct(id: string): Promise<void> {
    try {
      const p = await firstValueFrom(this.api.get(id));
      this.form.patchValue({
        name: p.name,
        lenderName: p.lenderName,
        active: p.active,
        rateMode: p.rateMode,
        taegPct: p.taegBp / 100,
        tanPct: p.tanBp / 100,
        defaultTermMonths: p.defaultTermMonths,
        defaultDownPaymentPct: p.defaultDownPaymentPct,
        maxDownPaymentPct: p.maxDownPaymentPct,
        openingFeeEur: p.openingFeeCents / 100,
        monthlyFeeEur: p.monthlyFeeCents / 100,
        stampDutyPct: p.stampDutyRateBp / 100,
        minFinancedEur: p.minFinancedCents / 100,
        maxFinancedEur: p.maxFinancedCents / 100,
        maxVehicleAgeAtEndYears: p.maxVehicleAgeAtEndYears,
        budgetNearPct: p.budgetNearPct,
        representativeExampleTemplate: p.representativeExampleTemplate ?? '',
        legalNote: p.legalNote ?? '',
      });
      this.selectedTerms.set(new Set(p.allowedTerms));
    } catch {
      this.toast.error('Erro ao carregar produto.');
    }
  }

  protected isTermSelected(t: number): boolean { return this.selectedTerms().has(t); }

  protected toggleTerm(t: number): void {
    this.selectedTerms.update((s) => {
      const next = new Set(s);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }

  protected async onSave(): Promise<void> {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = {
      name: v.name,
      lenderName: v.lenderName,
      active: v.active,
      rateMode: v.rateMode as 'TAEG_INPUT' | 'TAN_AND_FEES',
      taegBp: Math.round(+v.taegPct * 100),
      tanBp: Math.round(+v.tanPct * 100),
      allowedTerms: Array.from(this.selectedTerms()).sort((a, b) => a - b),
      defaultTermMonths: +v.defaultTermMonths,
      defaultDownPaymentPct: +v.defaultDownPaymentPct,
      maxDownPaymentPct: +v.maxDownPaymentPct,
      openingFeeCents: Math.round(+v.openingFeeEur * 100),
      monthlyFeeCents: Math.round(+v.monthlyFeeEur * 100),
      stampDutyRateBp: Math.round(+v.stampDutyPct * 100),
      minFinancedCents: Math.round(+v.minFinancedEur * 100),
      maxFinancedCents: Math.round(+v.maxFinancedEur * 100),
      maxVehicleAgeAtEndYears: v.maxVehicleAgeAtEndYears ? +v.maxVehicleAgeAtEndYears : null,
      budgetNearPct: +v.budgetNearPct,
      representativeExampleTemplate: v.representativeExampleTemplate || null,
      legalNote: v.legalNote || null,
    };

    this.saving.set(true);
    try {
      const id = this.route.snapshot.paramMap.get('id');
      if (this.isNew()) {
        await firstValueFrom(this.api.create(payload));
      } else {
        await firstValueFrom(this.api.update(id!, payload));
      }
      this.toast.success('Produto guardado.');
      this.router.navigate(['/admin/financiamento']);
    } catch (err: unknown) {
      this.toast.error((err as { detail?: string })?.detail ?? 'Erro ao guardar.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async runSimulation(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.simLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.simulate({
        priceCents: Math.round(+this.simPrice * 100),
        entryCents: Math.round(+this.simEntry * 100),
        termMonths: +this.simTerm,
        financingProductId: id && !this.isNew() ? id : undefined,
      }));
      this.simResult.set(res);
    } catch {
      this.toast.error('Erro ao simular.');
    } finally {
      this.simLoading.set(false);
    }
  }
}
