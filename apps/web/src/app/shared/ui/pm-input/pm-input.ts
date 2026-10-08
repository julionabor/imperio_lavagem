import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'pm-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PmInput), multi: true }],
  template: `
    <div class="flex flex-col gap-1">
      @if (label()) {
        <label [for]="id()" class="text-sm font-medium text-ink-300">{{ label() }}</label>
      }
      <input
        [id]="id()"
        [type]="type()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled"
        [(ngModel)]="innerValue"
        (ngModelChange)="onChange($event)"
        (blur)="onTouched()"
        class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder-ink-500 transition-colors focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 disabled:opacity-40"
        [class.border-error]="error()"
      />
      @if (error()) {
        <p class="text-xs text-error">{{ error() }}</p>
      }
    </div>
  `,
})
export class PmInput implements ControlValueAccessor {
  readonly id = input(`pm-input-${Math.random().toString(36).slice(2)}`);
  readonly label = input('');
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'url' | 'tel'>('text');
  readonly placeholder = input('');
  readonly error = input('');

  protected innerValue: unknown = '';
  protected isDisabled = false;
  protected onChange: (v: unknown) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(v: unknown): void { this.innerValue = v; }
  registerOnChange(fn: (v: unknown) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled = d; }
}
