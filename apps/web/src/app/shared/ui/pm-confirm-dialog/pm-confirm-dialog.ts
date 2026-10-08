import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Injectable, signal } from '@angular/core';
import { PmButton } from '../pm-button/pm-button';

interface DialogConfig { title: string; message: string; confirmLabel?: string; }

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly isOpen = signal(false);
  readonly config = signal<DialogConfig>({ title: '', message: '' });
  private resolve!: (v: boolean) => void;

  open(config: DialogConfig): Promise<boolean> {
    this.config.set(config);
    this.isOpen.set(true);
    return new Promise((res) => { this.resolve = res; });
  }

  confirm(): void { this.isOpen.set(false); this.resolve(true); }
  cancel(): void  { this.isOpen.set(false); this.resolve(false); }
}

@Component({
  selector: 'pm-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PmButton],
  template: `
    @if (svc.isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div class="w-full max-w-sm rounded-2xl border border-ink-800 bg-ink-900 p-6 shadow-overlay">
          <h2 class="mb-2 text-lg font-semibold text-ink-100">{{ svc.config().title }}</h2>
          <p class="mb-6 text-sm text-ink-400">{{ svc.config().message }}</p>
          <div class="flex justify-end gap-3">
            <pm-button variant="secondary" (click)="svc.cancel()">Cancelar</pm-button>
            <pm-button variant="danger" (click)="svc.confirm()">
              {{ svc.config().confirmLabel ?? 'Confirmar' }}
            </pm-button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PmConfirmDialog {
  protected readonly svc = inject(ConfirmDialogService);
}
