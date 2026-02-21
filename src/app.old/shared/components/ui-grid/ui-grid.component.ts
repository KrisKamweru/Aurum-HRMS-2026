import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="ui-grid"
      [style.--ui-grid-columns]="columns"
      [style.--ui-grid-gap]="gap"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .ui-grid {
      display: grid;
      grid-template-columns: var(--ui-grid-columns, 1fr);
      gap: var(--ui-grid-gap, 1rem);
      min-height: 0;
    }

    @media (max-width: 900px) {
      .ui-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UiGridComponent {
  @Input() columns = '1fr';
  @Input() gap = '1rem';
}
