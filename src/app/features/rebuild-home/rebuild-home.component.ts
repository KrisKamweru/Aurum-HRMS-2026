import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-rebuild-home',
  template: ''
})
export class RebuildHomeComponent {
  readonly phaseLabel = 'Phase 2: Legacy archived';
}


