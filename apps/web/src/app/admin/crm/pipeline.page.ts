import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal, computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, CdkDrag, CdkDropList, CdkDropListGroup, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CrmApi, type PipelineStage, type LeadSummary } from './crm.api';

const TYPE_LABELS: Record<string, string> = {
  QUOTE: 'Orçamento', TEST_DRIVE: 'Test Drive', CONTACT: 'Contacto',
  TRADE_IN: 'Retoma', FINANCING: 'Financiamento', SOURCING: 'Pesquisa',
};

@Component({
  selector: 'pm-pipeline-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CdkDrag, CdkDropList, CdkDropListGroup],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-h2 font-display font-bold">Pipeline</h1>
      <a routerLink="/admin/crm/contactos"
         class="px-4 py-2 rounded-lg border border-ink-700 text-label text-ink-300
                hover:border-ink-500 hover:text-white transition-colors no-underline">
        Ver contactos
      </a>
    </div>

    @if (loading()) {
      <div class="flex gap-4 overflow-x-auto pb-4">
        @for (i of [1,2,3,4]; track i) {
          <div class="shrink-0 w-72 rounded-xl bg-ink-900 h-48 animate-pulse"></div>
        }
      </div>
    } @else if (stages().length === 0) {
      <div class="flex flex-col items-center gap-3 py-16 text-center text-ink-500">
        <p class="text-h3 font-display">Sem etapas de pipeline</p>
        <p class="text-sm">Configure as etapas em Definições → Pipeline.</p>
      </div>
    } @else {
      <div cdkDropListGroup class="flex gap-4 overflow-x-auto pb-6 items-start">
        @for (stage of stages(); track stage.id) {
          <div class="shrink-0 w-72 flex flex-col gap-2">
            <!-- header da coluna -->
            <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-ink-900">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full {{ colorDot(stage.color) }}"></span>
                <span class="text-label font-semibold">{{ stage.name }}</span>
              </div>
              <span class="text-caption text-ink-500">{{ leadsForStage(stage.id).length }}</span>
            </div>

            <!-- cards -->
            <div
              cdkDropList
              [cdkDropListData]="{ stageId: stage.id }"
              (cdkDropListDropped)="onDrop($event)"
              class="flex flex-col gap-2 min-h-[80px] rounded-xl p-1 transition-colors"
              [class.bg-ink-900]="true"
            >
              @for (lead of leadsForStage(stage.id); track lead.id) {
                <div
                  cdkDrag
                  class="bg-ink-800 rounded-lg p-3 cursor-grab active:cursor-grabbing
                         border border-ink-700 hover:border-ink-600 transition-colors"
                >
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <span class="text-label font-medium text-white leading-tight">
                      {{ lead.contact.name }}
                    </span>
                    <span class="text-[11px] px-1.5 py-0.5 rounded bg-ink-700 text-ink-400 shrink-0">
                      {{ typeLabel(lead.type) }}
                    </span>
                  </div>
                  @if (lead.vehicle) {
                    <p class="text-caption text-ink-500 mb-1">
                      {{ lead.vehicle.brand.name }} {{ lead.vehicle.model.name }}
                    </p>
                  }
                  <p class="text-caption text-ink-600">
                    {{ formatDate(lead.createdAt) }}
                    @if (lead.assignedTo) { · {{ lead.assignedTo.name }} }
                  </p>
                </div>
              }

              @if (leadsForStage(stage.id).length === 0) {
                <div class="flex items-center justify-center h-16 rounded-lg border border-dashed border-ink-800">
                  <span class="text-caption text-ink-700">Sem leads</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class PipelinePage implements OnInit {
  private readonly api = inject(CrmApi);

  protected readonly loading = signal(true);
  protected readonly stages = signal<PipelineStage[]>([]);
  protected readonly leads = signal<LeadSummary[]>([]);

  protected readonly leadsForStage = (stageId: string) =>
    this.leads().filter((l) => l.stageId === stageId);

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    let stagesLoaded = false;
    let leadsLoaded = false;

    const done = () => {
      if (stagesLoaded && leadsLoaded) this.loading.set(false);
    };

    this.api.listStages().subscribe({
      next: (s) => { this.stages.set(s); stagesLoaded = true; done(); },
      error: () => { stagesLoaded = true; done(); },
    });

    this.api.listLeads({ pageSize: 200 }).subscribe({
      next: (r) => { this.leads.set(r.data); leadsLoaded = true; done(); },
      error: () => { leadsLoaded = true; done(); },
    });
  }

  protected onDrop(event: CdkDragDrop<{ stageId: string }>) {
    if (event.previousContainer === event.container) return;
    const targetStageId = event.container.data.stageId;
    const lead = event.item.data as LeadSummary;

    // Optimistic update
    this.leads.update((list) =>
      list.map((l) => l.id === lead.id ? { ...l, stageId: targetStageId } : l),
    );

    this.api.updateLeadStatus(lead.id, { stageId: targetStageId }).subscribe({
      error: () => {
        // Rollback
        this.leads.update((list) =>
          list.map((l) => l.id === lead.id ? { ...l, stageId: event.previousContainer.data.stageId } : l),
        );
      },
    });
  }

  protected typeLabel(type: string) {
    return TYPE_LABELS[type] ?? type;
  }

  protected colorDot(color: string) {
    const map: Record<string, string> = {
      gray: 'bg-ink-500', blue: 'bg-blue-500', green: 'bg-green-500',
      red: 'bg-red-500', yellow: 'bg-yellow-500', purple: 'bg-purple-500',
    };
    return map[color] ?? 'bg-ink-500';
  }

  protected formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  }
}
