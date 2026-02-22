import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-grid',
  template: `
    <div
      class="grid min-h-0"
      [style.--ui-grid-columns]="columns()"
      [style.--ui-grid-gap]="gap()"
      [style.grid-template-columns]="'var(--ui-grid-columns)'"
      [style.gap]="'var(--ui-grid-gap)'"
    >
      <ng-content></ng-content>
    </div>
  `
})
export class UiGridComponent {
  readonly columns = input('1fr');
  readonly gap = input('1rem');
}



