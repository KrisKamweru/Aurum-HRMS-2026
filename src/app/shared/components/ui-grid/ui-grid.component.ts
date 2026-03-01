import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-grid',
  template: `
    <div class="grid w-full" [style.gridTemplateColumns]="columns()" [style.gap]="gap()">
      <ng-content></ng-content>
    </div>
  `
})
export class UiGridComponent {
  readonly columns = input('1fr');
  readonly gap = input('1rem');
}



