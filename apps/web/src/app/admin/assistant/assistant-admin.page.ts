import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

interface AssistantSettings {
  id: string;
  active: boolean;
  botName: string | null;
  welcomeMessage: string | null;
  budgetTransitionMessage: string | null;
  confirmationTemplate: string | null;
}

interface AssistantStep {
  id: string;
  key: string;
  question: string;
  position: number;
  options: { label: string; value: string; [k: string]: unknown }[];
}

@Component({
  selector: 'pm-assistant-admin-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDrag, CdkDropList],
  template: `
    <h1 class="text-h2 font-display font-bold mb-6">Assistente guiado</h1>

    <div class="grid lg:grid-cols-[1fr_380px] gap-8">

      <!-- Passos do assistente -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-h3 font-display font-bold">Perguntas</h2>
          <button
            (click)="showAddStep.set(!showAddStep())"
            class="px-3 py-1.5 rounded-lg bg-red-500 text-white text-caption font-medium
                   hover:bg-red-600 transition-colors"
          >
            + Pergunta
          </button>
        </div>

        @if (showAddStep()) {
          <form (submit)="addStep($event)" class="rounded-xl bg-ink-900 p-4 mb-4 flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1">
                <label class="text-caption text-ink-500">Chave (key)</label>
                <input name="key" placeholder="ex: uso" required
                       class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
                              focus:outline-none focus:border-red-500 transition-colors"/>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-caption text-ink-500">Pergunta</label>
                <input name="question" placeholder="ex: Para que usa o carro?" required
                       class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
                              focus:outline-none focus:border-red-500 transition-colors"/>
              </div>
            </div>
            <div class="flex gap-2">
              <button type="submit"
                      class="px-4 py-2 rounded-lg bg-red-500 text-white text-caption font-medium hover:bg-red-600 transition-colors">
                Adicionar
              </button>
              <button type="button" (click)="showAddStep.set(false)"
                      class="px-4 py-2 rounded-lg bg-ink-800 text-ink-300 text-caption hover:bg-ink-700 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        }

        @if (loading()) {
          <div class="space-y-2">
            @for (i of [1,2,3,4]; track i) {
              <div class="h-16 rounded-lg bg-ink-900 animate-pulse"></div>
            }
          </div>
        } @else {
          <div cdkDropList (cdkDropListDropped)="onStepDrop($event)" class="space-y-2">
            @for (step of steps(); track step.id; let i = $index) {
              <div cdkDrag
                   class="rounded-xl bg-ink-900 p-4 cursor-grab active:cursor-grabbing
                          border border-ink-800 hover:border-ink-700">
                <div class="flex items-start gap-3">
                  <span class="text-ink-600 mt-0.5 select-none">⠿</span>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <code class="text-[11px] px-1.5 py-0.5 rounded bg-ink-800 text-ink-400">
                        {{ step.key }}
                      </code>
                    </div>
                    <p class="text-label text-white">{{ step.question }}</p>
                    @if (step.options.length > 0) {
                      <div class="flex flex-wrap gap-1 mt-2">
                        @for (opt of step.options; track opt.value) {
                          <span class="text-[11px] px-2 py-0.5 rounded-full bg-ink-800 text-ink-400">
                            {{ opt.label }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                  <button (click)="deleteStep(step.id)"
                          class="text-ink-600 hover:text-red-400 transition-colors p-1 shrink-0">
                    <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none">
                      <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="rounded-xl bg-ink-900 p-8 text-center text-ink-500">
                Sem perguntas configuradas.
              </div>
            }
          </div>
        }
      </section>

      <!-- Definições -->
      <aside>
        @if (settings()) {
          <div class="rounded-xl bg-ink-900 p-5 sticky top-[84px]">
            <h2 class="text-label font-semibold mb-4">Definições</h2>

            <form (submit)="saveSettings($event)" class="flex flex-col gap-4">
              <!-- Ativo -->
              <div class="flex items-center justify-between">
                <label class="text-label text-ink-300">Assistente ativo</label>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input #activeInput type="checkbox" [checked]="settings()!.active" class="sr-only peer"/>
                  <div class="w-9 h-5 bg-ink-700 rounded-full peer-checked:bg-red-500 transition-colors"></div>
                </label>
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-caption text-ink-500">Nome do bot</label>
                <input name="botName" [value]="settings()!.botName ?? ''"
                       class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
                              focus:outline-none focus:border-red-500 transition-colors"/>
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-caption text-ink-500">Mensagem de boas-vindas</label>
                <textarea name="welcomeMessage" rows="3" [value]="settings()!.welcomeMessage ?? ''"
                          class="w-full px-3 py-2 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
                                 resize-none focus:outline-none focus:border-red-500 transition-colors"></textarea>
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-caption text-ink-500">Mensagem de passagem para orçamento</label>
                <textarea name="budgetTransitionMessage" rows="2" [value]="settings()!.budgetTransitionMessage ?? ''"
                          class="w-full px-3 py-2 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
                                 resize-none focus:outline-none focus:border-red-500 transition-colors"></textarea>
              </div>

              <div class="flex gap-3">
                <button type="submit"
                        class="flex-1 min-h-[40px] rounded-xl bg-red-500 text-white font-semibold text-label
                               hover:bg-red-600 transition-all">
                  Guardar
                </button>
                @if (settingsSaved()) {
                  <span class="flex items-center text-green-400 text-label">✓</span>
                }
              </div>
            </form>
          </div>
        }
      </aside>
    </div>
  `,
})
export class AssistantAdminPage implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly loading = signal(true);
  protected readonly settings = signal<AssistantSettings | null>(null);
  protected readonly steps = signal<AssistantStep[]>([]);
  protected readonly showAddStep = signal(false);
  protected readonly settingsSaved = signal(false);

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    let settingsLoaded = false;
    let stepsLoaded = false;

    const done = () => { if (settingsLoaded && stepsLoaded) this.loading.set(false); };

    this.http.get<AssistantSettings>('/api/v1/admin/assistant/settings').subscribe({
      next: (s) => { this.settings.set(s); settingsLoaded = true; done(); },
      error: () => { settingsLoaded = true; done(); },
    });

    this.http.get<AssistantStep[]>('/api/v1/admin/assistant/steps').subscribe({
      next: (s) => { this.steps.set(s); stepsLoaded = true; done(); },
      error: () => { stepsLoaded = true; done(); },
    });
  }

  protected addStep(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const get = (n: string) => (form.elements.namedItem(n) as HTMLInputElement).value;
    const data = {
      key: get('key'),
      question: get('question'),
      position: this.steps().length,
      options: [],
    };
    this.http.post<AssistantStep>('/api/v1/admin/assistant/steps', data).subscribe({
      next: (step) => {
        this.steps.update((s) => [...s, step]);
        this.showAddStep.set(false);
        form.reset();
      },
    });
  }

  protected deleteStep(id: string) {
    this.http.delete(`/api/v1/admin/assistant/steps/${id}`).subscribe({
      next: () => this.steps.update((s) => s.filter((step) => step.id !== id)),
    });
  }

  protected onStepDrop(event: CdkDragDrop<AssistantStep[]>) {
    const list = [...this.steps()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.steps.set(list);
    // Persistir nova ordem
    this.http.patch('/api/v1/admin/assistant/steps/reorder', { ids: list.map((s) => s.id) }).subscribe();
  }

  protected saveSettings(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const get = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | HTMLTextAreaElement)?.value ?? '';
    const activeEl = form.querySelector('input[type=checkbox]') as HTMLInputElement;

    const data = {
      active: activeEl.checked,
      botName: get('botName') || null,
      welcomeMessage: get('welcomeMessage') || null,
      budgetTransitionMessage: get('budgetTransitionMessage') || null,
    };

    this.http.put('/api/v1/admin/assistant/settings', data).subscribe({
      next: (s) => {
        this.settings.set(s as AssistantSettings);
        this.settingsSaved.set(true);
        setTimeout(() => this.settingsSaved.set(false), 2000);
      },
    });
  }
}
