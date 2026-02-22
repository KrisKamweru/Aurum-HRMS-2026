import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-grid',
  template: ''
})
export class UiGridComponent {
  readonly columns = input('1fr');
  readonly gap = input('1rem');
}



