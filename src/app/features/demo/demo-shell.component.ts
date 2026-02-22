import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { UiNavItemComponent } from '../../shared/components/ui-nav-item/ui-nav-item.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demo-shell',
  imports: [RouterLink, RouterOutlet, UiNavItemComponent],
  template: ''
})
export class DemoShellComponent {}
