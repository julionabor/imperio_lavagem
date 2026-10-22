import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CrmApi, type Activity, type ContactSummary, type LeadSummary, type Task } from './crm.api';

type ContactDetail = ContactSummary & { leads: LeadSummary[]; activities: Activity[]; tasks: Task[] };

const ACTIVITY_ICONS: Record<string, string> = {
  CALL: '📞', WHATSAPP: '💬', EMAIL: '✉️', SMS: '📱',
  VISIT: '🏢', TEST_DRIVE: '🚗', NOTE: '📝', STAGE_CHANGE: '🔄', SYSTEM: '⚙️',
};
const ACTIVITY_LABELS: Record<string, string> = {
  CALL: 'Chamada', WHATSAPP: 'WhatsApp', EMAIL: 'Email', SMS: 'SMS',
  VISIT: 'Visita', TEST_DRIVE: 'Test Drive', NOTE: 'Nota', STAGE_CHANGE: 'Etapa', SYSTEM: 'Sistema',
};
const LIFECYCLE_COLORS: Record<string, string> = {
  LEAD: 'bg-blue-500/15 text-blue-400',
  PROSPECT: 'bg-yellow-500/15 text-yellow-400',
  CUSTOMER: 'bg-green-500/15 text-green-400',
  INACTIVE: 'bg-ink-700 text-ink-500',
};

@Component({
  selector: 'pm-contact-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="mb-6">
      <a routerLink="/admin/crm/contactos"
         class="text-caption text-ink-500 hover:text-white transition-colors no-underline mb-2 inline-block">
        ← Contactos
      </a>
      @if (contact(); as c) {
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center
                      text-h3 font-display font-bold text-red-400 shrink-0">
            {{ initials(c.name) }}
          </div>
          <div>
            <h1 class="text-h2 font-display font-bold">{{ c.name }}</h1>
            <div class="flex flex-wrap gap-3 mt-1 text-label text-ink-400">
              <a [href]="'tel:' + c.phone" class="hover:text-white no-underline">{{ c.phone }}</a>
              @if (c.email) {
                <a [href]="'mailto:' + c.email" class="hover:text-white no-underline">{{ c.email }}</a>
              }
              @if (c.locality) { <span>{{ c.locality }}</span> }
            </div>
          </div>
          <span class="ml-auto px-2.5 py-1 rounded-full text-[11px] font-medium {{ lifecycleColor(c.lifecycle) }}">
            {{ c.lifecycle }}
          </span>
        </div>
      }
    </div>

    @if (loading()) {
      <div class="space-y-3">
        @for (i of [1,2,3]; track i) {
          <div class="h-20 rounded-xl bg-ink-900 animate-pulse"></div>
        }
      </div>
    } @else if (contact(); as c) {
      <div class="grid lg:grid-cols-[1fr_360px] gap-6">

        <!-- Linha do tempo -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-h3 font-display font-bold">Linha do tempo</h2>
            <button
              (click)="newActivity.set(!newActivity())"
              class="px-3 py-1.5 rounded-lg bg-red-500 text-white text-caption font-medium
                     hover:bg-red-600 transition-colors"
            >
              + Atividade
            </button>
          </div>

          @if (newActivity()) {
            <form (submit)="submitActivity($event, c.id)"
                  class="rounded-xl bg-ink-900 p-4 mb-4 flex flex-col gap-3">
              <div class="grid grid-cols-2 gap-3">
                <select
                  #actType
                  class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
                         focus:outline-none focus:border-red-500 transition-colors"
                >
                  @for (t of activityTypes; track t.value) {
                    <option [value]="t.value">{{ t.label }}</option>
                  }
                </select>
                <select
                  #actDir
                  class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
                         focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="IN">Recebida</option>
                  <option value="OUT" selected>Enviada</option>
                </select>
              </div>
              <textarea
                #actSummary
                rows="2"
                placeholder="Resumo da atividade…"
                required
                class="w-full px-3 py-2 rounded-lg bg-ink-800 border border-ink-700
                       text-label text-white placeholder-ink-600 resize-none
                       focus:outline-none focus:border-red-500 transition-colors"
              ></textarea>
              <div class="flex gap-2">
                <button type="submit"
                        class="px-4 py-2 rounded-lg bg-red-500 text-white text-caption font-medium
                               hover:bg-red-600 transition-colors">
                  Guardar
                </button>
                <button type="button" (click)="newActivity.set(false)"
                        class="px-4 py-2 rounded-lg bg-ink-800 text-ink-300 text-caption
                               hover:bg-ink-700 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          }

          <div class="relative pl-6 space-y-0">
            @for (act of activities(); track act.id) {
              <div class="relative pb-5">
                <!-- linha vertical -->
                <div class="absolute left-[-12px] top-0 bottom-0 w-px bg-ink-800"></div>
                <!-- dot -->
                <div class="absolute left-[-16px] top-1 w-2 h-2 rounded-full bg-ink-600 border-2 border-ink-950"></div>

                <div class="bg-ink-900 rounded-lg px-4 py-3">
                  <div class="flex items-center gap-2 mb-1">
                    <span>{{ activityIcon(act.type) }}</span>
                    <span class="text-caption font-medium text-ink-300">{{ activityLabel(act.type) }}</span>
                    <span class="text-caption text-ink-600 ml-auto">{{ formatDate(act.occurredAt) }}</span>
                  </div>
                  <p class="text-label text-ink-200">{{ act.summary }}</p>
                  @if (act.author) {
                    <p class="text-caption text-ink-600 mt-1">por {{ act.author.name }}</p>
                  }
                </div>
              </div>
            } @empty {
              <p class="text-ink-500 text-label">Sem atividades registadas.</p>
            }
          </div>
        </section>

        <!-- Sidebar: leads + tasks -->
        <aside class="flex flex-col gap-5">
          <!-- Leads -->
          <div class="rounded-xl bg-ink-900 p-4">
            <h3 class="text-label font-semibold mb-3">Leads ({{ c.leads.length }})</h3>
            @for (lead of c.leads; track lead.id) {
              <div class="py-2 border-b border-ink-800 last:border-0">
                <div class="flex items-center gap-2">
                  @if (lead.stage) {
                    <span class="w-2 h-2 rounded-full bg-ink-500 shrink-0"></span>
                    <span class="text-caption text-ink-400">{{ lead.stage.name }}</span>
                  }
                  <span class="ml-auto text-caption text-ink-600">{{ formatDate(lead.createdAt) }}</span>
                </div>
                @if (lead.vehicle) {
                  <p class="text-caption text-ink-500 mt-0.5">
                    {{ lead.vehicle.brand.name }} {{ lead.vehicle.model.name }}
                  </p>
                }
              </div>
            } @empty {
              <p class="text-caption text-ink-600">Sem leads.</p>
            }
          </div>

          <!-- Tarefas abertas -->
          <div class="rounded-xl bg-ink-900 p-4">
            <h3 class="text-label font-semibold mb-3">Tarefas abertas</h3>
            @for (task of openTasks(); track task.id) {
              <div class="flex items-start gap-2 py-2 border-b border-ink-800 last:border-0">
                <button
                  (click)="completeTask(task.id)"
                  class="w-4 h-4 rounded border border-ink-600 mt-0.5 shrink-0
                         hover:border-green-500 transition-colors"
                ></button>
                <div>
                  <p class="text-caption text-ink-200">{{ task.title }}</p>
                  <p class="text-[11px] text-ink-600">{{ formatDate(task.dueAt) }}</p>
                </div>
              </div>
            } @empty {
              <p class="text-caption text-ink-600">Sem tarefas abertas.</p>
            }
          </div>
        </aside>
      </div>
    }
  `,
})
export class ContactDetailPage implements OnInit {
  private readonly api = inject(CrmApi);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly contact = signal<ContactDetail | null>(null);
  protected readonly activities = signal<Activity[]>([]);
  protected readonly newActivity = signal(false);

  protected readonly openTasks = () => {
    const tasks: Task[] = this.contact()?.tasks ?? [];
    return tasks.filter((t) => t.status === 'OPEN');
  };

  protected readonly activityTypes = [
    { value: 'CALL', label: 'Chamada' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'SMS', label: 'SMS' },
    { value: 'VISIT', label: 'Visita' },
    { value: 'TEST_DRIVE', label: 'Test Drive' },
    { value: 'NOTE', label: 'Nota' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getContact(id).subscribe({
      next: (c) => {
        this.contact.set(c);
        this.activities.set(c.activities ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected submitActivity(e: Event, contactId: string) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const type = (form.querySelector('select:nth-of-type(1)') as HTMLSelectElement).value;
    const direction = (form.querySelector('select:nth-of-type(2)') as HTMLSelectElement).value;
    const summary = (form.querySelector('textarea') as HTMLTextAreaElement).value;
    if (!summary.trim()) return;

    this.api.createActivity(contactId, { type, direction, summary }).subscribe({
      next: (act) => {
        this.activities.update((list) => [act, ...list]);
        this.newActivity.set(false);
      },
    });
  }

  protected completeTask(taskId: string) {
    this.api.updateTask(taskId, { status: 'DONE' }).subscribe({
      next: () => {
        this.contact.update((c) => {
          if (!c) return c;
          return { ...c, tasks: c.tasks.map(
            (t) => t.id === taskId ? { ...t, status: 'DONE' as const } : t,
          ) };
        });
      },
    });
  }

  protected initials(name: string) {
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  }
  protected lifecycleColor(l: string) { return LIFECYCLE_COLORS[l] ?? 'bg-ink-700 text-ink-500'; }
  protected activityIcon(t: string) { return ACTIVITY_ICONS[t] ?? '•'; }
  protected activityLabel(t: string) { return ACTIVITY_LABELS[t] ?? t; }
  protected formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
