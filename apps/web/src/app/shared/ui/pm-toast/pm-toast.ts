import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Injectable } from '@angular/core';
import { NgClass } from '@angular/common';

export type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private seq = 0;

  show(message: string, type: ToastType = 'info', duration = 4000): void {
    const id = ++this.seq;
    this.toasts.update((t) => [...t, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(msg: string): void { this.show(msg, 'success'); }
  error(msg: string): void { this.show(msg, 'error', 6000); }

  dismiss(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}

@Component({
  selector: 'pm-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      @for (toast of svc.toasts(); track toast.id) {
        <div
          [ngClass]="{
            'bg-success-bg border-success/30 text-success': toast.type === 'success',
            'bg-error-bg border-error/30 text-error': toast.type === 'error',
            'bg-info-bg border-info/30 text-info': toast.type === 'info'
          }"
          class="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-overlay"
        >
          <span class="flex-1">{{ toast.message }}</span>
          <button (click)="svc.dismiss(toast.id)" class="shrink-0 opacity-60 hover:opacity-100">✕</button>
        </div>
      }
    </div>
  `,
})
export class PmToastContainer {
  protected readonly svc = inject(ToastService);
}
