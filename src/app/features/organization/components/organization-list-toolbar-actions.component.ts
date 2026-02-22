import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-organization-list-toolbar-actions',
  template: ''
})
export class OrganizationListToolbarActionsComponent {
  readonly refreshLabel = input('Refresh');
  readonly createLabel = input('Create');
  readonly disabled = input(false);

  readonly refreshRequested = output<void>();
  readonly createRequested = output<void>();
}


