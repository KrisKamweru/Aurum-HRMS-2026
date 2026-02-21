import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-grid',
  standalone: true,
  template: `
    <div
      class="grid min-h-0"
      [style.--ui-grid-columns]="columns"
      [style.--ui-grid-gap]="gap"
      [style.grid-template-columns]="'var(--ui-grid-columns)'"
      [style.gap]="'var(--ui-grid-gap)'"
    >
      <ng-content></ng-content>
    </div>
  `
})
export class UiGridComponent {
  @Input() columns = '1fr';
  @Input() gap = '1rem';
}

