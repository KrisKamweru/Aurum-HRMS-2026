import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiAvatarComponent } from '../../../shared/components/ui-avatar/ui-avatar.component';
import { UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiGridComponent } from '../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../shared/components/ui-grid/ui-grid-tile.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-buttons-demo',
  imports: [UiAvatarComponent, UiBadgeComponent, UiButtonComponent, UiCardComponent, UiGridComponent, UiGridTileComponent],
  template: ''
})
export class ButtonsDemoComponent {}
