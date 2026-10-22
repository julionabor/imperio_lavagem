import {
  Component, ChangeDetectionStrategy, inject, signal, computed, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SiteStore } from '../../search/data-access/site.store';
import type { AssistantStep } from '../../search/data-access/site.api';
import { formatEur } from '../../../shared/util/format';

type PanelStep =
  | 'welcome'
  | 'questions'
  | 'typing'
  | 'results'
  | 'form'
  | 'done';

interface RecoVehicle {
  id: string;
  brand: string;
  model: string;
  priceCents: number;
  coverImage: { variants: { card: string } } | null;
}

@Component({
  selector: 'pm-assistant',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Botão flutuante -->
    @if (!open()) {
      <button
        (click)="openPanel()"
        class="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-red-500 text-white shadow-xl
               flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all"
        aria-label="Abrir assistente"
      >
        <svg viewBox="0 0 24 24" class="w-6 h-6" fill="none">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2 22l5-1.338A9.96 9.96 0 0 0 12 22Z"
                stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M8 12h.01M12 12h.01M16 12h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    }

    <!-- Painel lateral -->
    @if (open()) {
      <!-- backdrop mobile -->
      <div class="fixed inset-0 z-40 bg-black/60 lg:hidden" (click)="close()"></div>

      <aside class="fixed bottom-0 right-0 z-50 flex flex-col
                    w-full lg:w-[420px] lg:top-0 lg:bottom-auto lg:h-screen
                    bg-ink-950 border-t lg:border-t-0 lg:border-l border-ink-800
                    shadow-2xl transition-transform">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-ink-800 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-[13px] font-bold">
              PM
            </div>
            <div>
              <p class="text-label font-semibold text-white leading-tight">
                {{ botName() }}
              </p>
              <p class="text-[11px] text-green-400 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
          <button (click)="close()"
                  class="w-8 h-8 rounded-lg bg-ink-800 text-ink-400 hover:text-white
                         flex items-center justify-center transition-colors">
            <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none">
              <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Conteúdo com scroll -->
        <div class="flex-1 overflow-y-auto px-5 py-5 space-y-4 max-h-[80vh] lg:max-h-none">

          <!-- Boas-vindas -->
          @if (step() === 'welcome') {
            <div class="flex flex-col items-start gap-4">
              <div class="bg-ink-900 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                <p class="text-label text-ink-100 leading-relaxed">
                  {{ welcomeMessage() }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2 mt-2">
                <button
                  (click)="startFlow()"
                  class="px-4 py-2.5 rounded-full bg-red-500 text-white text-label font-medium
                         hover:bg-red-600 active:scale-95 transition-all"
                >
                  Ajudem-me a escolher
                </button>
                <button
                  (click)="goToForm()"
                  class="px-4 py-2.5 rounded-full border border-ink-700 text-ink-300 text-label
                         hover:border-ink-500 hover:text-white active:scale-95 transition-all"
                >
                  Quero um orçamento
                </button>
              </div>
            </div>
          }

          <!-- Perguntas -->
          @if (step() === 'questions') {
            <!-- mensagens anteriores -->
            @for (msg of messages(); track $index) {
              <div [class]="msg.from === 'bot'
                ? 'flex justify-start'
                : 'flex justify-end'">
                <div [class]="msg.from === 'bot'
                  ? 'bg-ink-900 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]'
                  : 'bg-red-500/20 border border-red-500/30 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]'">
                  <p class="text-label text-ink-100">{{ msg.text }}</p>
                </div>
              </div>
            }

            <!-- pergunta atual -->
            @if (currentStep(); as cs) {
              <div class="flex justify-start">
                <div class="bg-ink-900 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                  <p class="text-label text-ink-100 leading-relaxed">{{ cs.question }}</p>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                @for (opt of cs.options; track opt.value) {
                  <button
                    (click)="answer(cs, opt)"
                    class="px-4 py-2 rounded-full border border-ink-700 text-ink-300 text-label
                           hover:border-red-500 hover:text-white active:scale-95 transition-all"
                  >
                    {{ opt.label }}
                  </button>
                }
              </div>
            }
          }

          <!-- A escrever... -->
          @if (step() === 'typing') {
            @for (msg of messages(); track $index) {
              <div [class]="msg.from === 'bot' ? 'flex justify-start' : 'flex justify-end'">
                <div [class]="msg.from === 'bot'
                  ? 'bg-ink-900 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]'
                  : 'bg-red-500/20 border border-red-500/30 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]'">
                  <p class="text-label text-ink-100">{{ msg.text }}</p>
                </div>
              </div>
            }
            <div class="flex justify-start">
              <div class="bg-ink-900 rounded-2xl rounded-tl-sm px-4 py-3">
                <div class="flex gap-1">
                  <span class="w-2 h-2 rounded-full bg-ink-500 animate-bounce" style="animation-delay:0ms"></span>
                  <span class="w-2 h-2 rounded-full bg-ink-500 animate-bounce" style="animation-delay:150ms"></span>
                  <span class="w-2 h-2 rounded-full bg-ink-500 animate-bounce" style="animation-delay:300ms"></span>
                </div>
              </div>
            </div>
          }

          <!-- Resultados -->
          @if (step() === 'results') {
            @for (msg of messages(); track $index) {
              <div [class]="msg.from === 'bot' ? 'flex justify-start' : 'flex justify-end'">
                <div [class]="msg.from === 'bot'
                  ? 'bg-ink-900 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]'
                  : 'bg-red-500/20 border border-red-500/30 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]'">
                  <p class="text-label text-ink-100">{{ msg.text }}</p>
                </div>
              </div>
            }

            <div class="flex justify-start">
              <div class="bg-ink-900 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]">
                <p class="text-label text-ink-100 mb-3">
                  {{ exact() ? 'Estas viaturas parecem ser as ideais para si:' : 'Não encontrei a combinação perfeita, mas estas ficam perto:' }}
                </p>
                <div class="flex flex-col gap-2">
                  @for (v of recommendations(); track v.id) {
                    <a [href]="'/viaturas/' + v.id"
                       class="flex items-center gap-3 rounded-xl bg-ink-800 p-3 no-underline
                              hover:bg-ink-700 transition-colors">
                      @if (v.coverImage) {
                        <img [src]="v.coverImage.variants.card" [alt]="v.brand"
                             class="w-16 h-12 object-cover rounded-lg shrink-0"/>
                      } @else {
                        <div class="w-16 h-12 rounded-lg bg-ink-700 shrink-0"></div>
                      }
                      <div>
                        <p class="text-label font-medium text-white">{{ v.brand }} {{ v.model }}</p>
                        <p class="text-caption text-ink-400">{{ formatEur(v.priceCents) }}</p>
                      </div>
                    </a>
                  }
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                (click)="step.set('form')"
                class="px-4 py-2.5 rounded-full bg-red-500 text-white text-label font-medium
                       hover:bg-red-600 active:scale-95 transition-all"
              >
                Pedir orçamento personalizado
              </button>
              <button
                (click)="restart()"
                class="px-4 py-2.5 rounded-full border border-ink-700 text-ink-300 text-label
                       hover:border-ink-500 hover:text-white active:scale-95 transition-all"
              >
                Recomeçar
              </button>
            </div>
          }

          <!-- Formulário -->
          @if (step() === 'form') {
            <form (submit)="submitForm($event)" class="flex flex-col gap-3">
              <div class="bg-ink-900 rounded-2xl rounded-tl-sm px-4 py-3">
                <p class="text-label text-ink-100">
                  Para vos enviar uma proposta personalizada, precisamos do seu nome e telemóvel.
                </p>
              </div>

              <input
                type="text"
                name="name"
                placeholder="O seu nome"
                required
                class="h-11 px-4 rounded-xl bg-ink-800 border border-ink-700 text-label text-white
                       placeholder-ink-600 focus:outline-none focus:border-red-500 transition-colors"
              />
              <input
                type="tel"
                name="phone"
                placeholder="+351 9XX XXX XXX"
                required
                class="h-11 px-4 rounded-xl bg-ink-800 border border-ink-700 text-label text-white
                       placeholder-ink-600 focus:outline-none focus:border-red-500 transition-colors"
              />
              <!-- honeypot -->
              <input type="text" name="website" style="display:none" value=""/>

              @if (formError()) {
                <p class="text-caption text-red-400">{{ formError() }}</p>
              }

              <button
                type="submit"
                [disabled]="formLoading()"
                class="min-h-[48px] rounded-xl bg-red-500 text-white font-semibold text-label
                       hover:bg-red-600 disabled:opacity-50 active:scale-[.98] transition-all"
              >
                {{ formLoading() ? 'A enviar…' : 'Enviar' }}
              </button>
            </form>
          }

          <!-- Confirmação -->
          @if (step() === 'done') {
            <div class="flex flex-col items-center gap-4 py-8 text-center">
              <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" class="w-8 h-8 text-green-400" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <p class="text-h3 font-display font-bold text-white mb-1">
                  Obrigado, {{ firstName() }}!
                </p>
                <p class="text-label text-ink-400 leading-relaxed">
                  Recebemos o seu pedido e entraremos em contacto brevemente.
                </p>
              </div>
              <button
                (click)="restart()"
                class="px-4 py-2 rounded-full border border-ink-700 text-ink-300 text-label
                       hover:border-ink-500 hover:text-white transition-all"
              >
                Recomeçar
              </button>
            </div>
          }
        </div>
      </aside>
    }
  `,
})
export class PmAssistant {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly siteStore = inject(SiteStore);

  protected readonly formatEur = formatEur;

  protected readonly open = signal(false);
  protected readonly step = signal<PanelStep>('welcome');
  protected readonly messages = signal<{ from: 'bot' | 'user'; text: string }[]>([]);
  protected readonly answers = signal<Record<string, string>>({});
  protected readonly stepIndex = signal(0);
  protected readonly recommendations = signal<RecoVehicle[]>([]);
  protected readonly exact = signal(true);
  protected readonly formLoading = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly firstName = signal('');

  protected readonly botName = computed(() =>
    this.siteStore.assistantSettings()?.botName ?? 'Assistente Private Motors',
  );
  protected readonly welcomeMessage = computed(() =>
    this.siteStore.assistantSettings()?.welcomeMessage ??
    'Olá! Estou aqui para ajudar a encontrar o carro ideal para si. Como posso ajudar?',
  );

  protected readonly steps = computed(() =>
    this.siteStore.assistantSettings()?.steps ?? [],
  );

  protected readonly currentStep = computed((): AssistantStep | null => {
    const list = this.steps();
    const idx = this.stepIndex();
    return idx < list.length ? list[idx]! : null;
  });

  protected openPanel() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.open.set(true);
  }

  protected close() { this.open.set(false); }

  protected startFlow() {
    this.step.set('questions');
    this.stepIndex.set(0);
    this.messages.set([]);
    this.answers.set({});
  }

  protected goToForm() {
    this.step.set('form');
  }

  protected answer(cs: AssistantStep, opt: { label: string; value: string }) {
    // Adiciona mensagens
    this.messages.update((m) => [
      ...m,
      { from: 'bot', text: cs.question },
      { from: 'user', text: opt.label },
    ]);
    this.answers.update((a) => ({ ...a, [cs.key]: opt.value }));

    const nextIdx = this.stepIndex() + 1;
    const allSteps = this.steps();

    if (nextIdx >= allSteps.length) {
      // Todas as perguntas respondidas → recomendar
      this.step.set('typing');
      this.fetchRecommendations();
    } else {
      this.stepIndex.set(nextIdx);
    }
  }

  private fetchRecommendations() {
    const answers = this.answers();
    this.http.post<{ vehicles: RecoVehicle[]; exact: boolean }>('/api/v1/public/assistant/recommend', answers).subscribe({
      next: (r) => {
        this.recommendations.set(r.vehicles);
        this.exact.set(r.exact);
        this.messages.update((m) => [
          ...m,
          { from: 'bot', text: r.exact ? 'Encontrei algumas opções que se adaptam ao seu perfil!' : 'Não encontrei a combinação perfeita, mas estas são as mais próximas.' },
        ]);
        this.step.set('results');
      },
      error: () => {
        this.messages.update((m) => [...m, { from: 'bot', text: 'Não consegui obter recomendações. Tente novamente.' }]);
        this.step.set('welcome');
      },
    });
  }

  protected submitForm(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value.trim();
    const website = (form.elements.namedItem('website') as HTMLInputElement).value;
    if (website) { this.step.set('done'); return; } // honeypot

    this.formLoading.set(true);
    this.formError.set(null);

    this.http.post('/api/v1/public/leads', {
      name,
      phone,
      type: 'QUOTE',
      source: 'ASSISTANT',
      consentPrivacy: true,
      consentMarketing: false,
      assistantAnswers: this.answers(),
      website: '',
    }).subscribe({
      next: () => {
        this.firstName.set(name.split(' ')[0]!);
        this.formLoading.set(false);
        this.step.set('done');
      },
      error: (err) => {
        this.formError.set(err?.error?.detail ?? 'Erro ao enviar. Tente de novo.');
        this.formLoading.set(false);
      },
    });
  }

  protected restart() {
    this.step.set('welcome');
    this.messages.set([]);
    this.answers.set({});
    this.stepIndex.set(0);
    this.recommendations.set([]);
    this.formError.set(null);
  }
}
