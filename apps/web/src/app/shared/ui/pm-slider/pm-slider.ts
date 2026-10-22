import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
} from '@angular/core';

@Component({
  selector: 'pm-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2">
      @if (label()) {
        <div class="flex items-center justify-between">
          <span class="text-label text-ink-400">{{ label() }}</span>
          <span class="text-label text-white font-medium">{{ displayValue() }}</span>
        </div>
      }
      <div class="relative h-6 flex items-center">
        <div class="w-full h-1 rounded-full bg-ink-700 relative">
          <div
            class="absolute left-0 h-1 rounded-full bg-red-500"
            [style.width.%]="fillPercent()"
          ></div>
        </div>
        <input
          type="range"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [value]="internal()"
          (input)="onInput($event)"
          (change)="onChange($event)"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          [attr.aria-label]="label()"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          [attr.aria-valuenow]="internal()"
        />
        <div
          class="absolute w-5 h-5 rounded-full bg-white shadow pointer-events-none"
          [style.left]="'calc(' + fillPercent() + '% - 10px)'"
        ></div>
      </div>
    </div>
  `,
})
export class PmSlider {
  readonly label = input<string>('');
  readonly min = input<number>(0);
  readonly max = input<number>(100);
  readonly step = input<number>(1);
  readonly value = input<number>(0);
  readonly format = input<(v: number) => string>((v) => String(v));

  readonly valueChange = output<number>();

  protected readonly internal = signal(0);

  protected readonly fillPercent = computed(() => {
    const range = this.max() - this.min();
    if (range === 0) return 0;
    return ((this.internal() - this.min()) / range) * 100;
  });

  protected readonly displayValue = computed(() => this.format()(this.internal()));

  constructor() {
    effect(() => {
      this.internal.set(this.value());
    });
  }

  protected onInput(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    this.internal.set(v);
  }

  protected onChange(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    this.valueChange.emit(v);
  }
}
