import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  contentChild,
  TemplateRef,
} from '@angular/core';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';

export interface ReorderEvent { previousIndex: number; currentIndex: number; }

@Component({
  selector: 'pm-sortable-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropList, CdkDrag, NgTemplateOutlet],
  template: `
    <div
      cdkDropList
      [cdkDropListData]="items()"
      (cdkDropListDropped)="onDrop($event)"
      class="flex flex-col gap-2"
    >
      @for (item of items(); track trackFn()(item); let i = $index) {
        <div cdkDrag class="cursor-grab active:cursor-grabbing">
          <div class="cdkDragPlaceholder hidden" *cdkDragPlaceholder></div>
          <ng-container *ngTemplateOutlet="itemTemplate(); context: { $implicit: item, index: i }" />
        </div>
      }
    </div>
  `,
})
export class PmSortableList<T = unknown> {
  readonly items = input.required<T[]>();
  readonly itemTemplate = input.required<TemplateRef<{ $implicit: T; index: number }>>();
  readonly trackFn = input<(item: T) => unknown>((item) => item);

  readonly reorder = output<ReorderEvent>();

  protected onDrop(event: CdkDragDrop<T[]>): void {
    this.reorder.emit({
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
    });
  }
}
