import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'pm-uploader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-700 bg-ink-900 p-8 text-center transition-colors hover:border-ink-500"
      [class.border-red-400]="dragging()"
      [class.bg-ink-850]="dragging()"
      (dragover)="$event.preventDefault(); dragging.set(true)"
      (dragleave)="dragging.set(false)"
      (drop)="onDrop($event)"
    >
      <svg class="h-10 w-10 text-ink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
      </svg>
      <p class="text-sm text-ink-400">
        Arraste ficheiros ou
        <label class="cursor-pointer text-red-400 underline hover:text-red-300">
          clique para selecionar
          <input
            type="file"
            class="sr-only"
            [accept]="accept()"
            [multiple]="multiple()"
            (change)="onFileInput($event)"
          />
        </label>
      </p>
      <p class="text-xs text-ink-500">{{ hint() }}</p>
    </div>
  `,
})
export class PmUploader {
  readonly accept = input('image/jpeg,image/png,image/webp');
  readonly multiple = input(true);
  readonly hint = input('JPEG, PNG ou WebP · máx. 15 MB cada · até 40 fotos');

  readonly filesSelected = output<File[]>();
  protected readonly dragging = signal(false);

  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length) this.filesSelected.emit(files);
  }

  protected onFileInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (files.length) this.filesSelected.emit(files);
    input.value = '';
  }
}
