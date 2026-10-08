import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => string;
}

export interface SortEvent { key: string; dir: 'asc' | 'desc'; }

@Component({
  selector: 'pm-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    <div class="overflow-x-auto rounded-xl border border-ink-800">
      <table class="w-full text-sm text-ink-200">
        <thead class="border-b border-ink-800 bg-ink-900">
          <tr>
            @for (col of columns(); track col.key) {
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-400"
                [style.width]="col.width"
                [class.cursor-pointer]="col.sortable"
                (click)="col.sortable && onSort(col.key)"
              >
                {{ col.label }}
                @if (col.sortable && sortKey() === col.key) {
                  {{ sortDir() === 'asc' ? '↑' : '↓' }}
                }
              </th>
            }
            @if (hasActions()) {
              <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-ink-400">Ações</th>
            }
          </tr>
        </thead>
        <tbody class="divide-y divide-ink-800">
          @if (loading()) {
            @for (i of skeleton; track i) {
              <tr class="animate-pulse">
                @for (col of columns(); track col.key) {
                  <td class="px-4 py-3"><div class="h-4 rounded bg-ink-800"></div></td>
                }
                @if (hasActions()) {
                  <td class="px-4 py-3"><div class="h-4 w-16 rounded bg-ink-800 ml-auto"></div></td>
                }
              </tr>
            }
          } @else if (rows().length === 0) {
            <tr>
              <td [colSpan]="columns().length + (hasActions() ? 1 : 0)" class="px-4 py-12 text-center text-ink-500">
                Sem resultados.
              </td>
            </tr>
          } @else {
            @for (row of rows(); track rowKey(row)) {
              <tr class="hover:bg-ink-850 transition-colors" (click)="rowClick.emit(row)">
                @for (col of columns(); track col.key) {
                  <td class="px-4 py-3">
                    {{ col.render ? col.render(row) : getCellValue(row, col.key) }}
                  </td>
                }
                @if (hasActions()) {
                  <td class="px-4 py-3 text-right" (click)="$event.stopPropagation()">
                    <ng-content />
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
    @if (total() > pageSize()) {
      <div class="mt-4 flex items-center justify-between text-sm text-ink-400">
        <span>{{ total() }} registos</span>
        <div class="flex gap-2">
          <button
            class="px-3 py-1 rounded-lg border border-ink-700 hover:bg-ink-850 disabled:opacity-40"
            [disabled]="page() <= 1"
            (click)="pageChange.emit(page() - 1)"
          >← Anterior</button>
          <span class="px-3 py-1">{{ page() }} / {{ pages() }}</span>
          <button
            class="px-3 py-1 rounded-lg border border-ink-700 hover:bg-ink-850 disabled:opacity-40"
            [disabled]="page() >= pages()"
            (click)="pageChange.emit(page() + 1)"
          >Próxima →</button>
        </div>
      </div>
    }
  `,
})
export class PmDataTable<T = Record<string, unknown>> {
  readonly columns = input.required<TableColumn<T>[]>();
  readonly rows = input<T[]>([]);
  readonly loading = input(false);
  readonly total = input(0);
  readonly page = input(1);
  readonly pageSize = input(20);
  readonly sortKey = input('');
  readonly sortDir = input<'asc' | 'desc'>('asc');
  readonly trackBy = input<keyof T | string>('id');
  readonly hasActions = input(false);

  readonly rowClick = output<T>();
  readonly pageChange = output<number>();
  readonly sortChange = output<SortEvent>();

  protected readonly skeleton = [1, 2, 3, 4, 5];

  protected pages() {
    return Math.max(1, Math.ceil(this.total() / this.pageSize()));
  }

  protected rowKey(row: T): unknown {
    return (row as Record<string, unknown>)[this.trackBy() as string];
  }

  protected getCellValue(row: T, key: string): string {
    const val = (row as Record<string, unknown>)[key];
    return val != null ? String(val) : '—';
  }

  protected onSort(key: string): void {
    const newDir = this.sortKey() === key && this.sortDir() === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ key, dir: newDir });
  }
}
