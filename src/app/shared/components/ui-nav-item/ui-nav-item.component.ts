import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-nav-item',
  imports: [RouterLink, RouterLinkActive],
  template: ''
})
export class UiNavItemComponent {
  readonly route = input.required<string | readonly unknown[]>();
  readonly exact = input(false);
  readonly badge = input<string | number>();
}



