import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-organization-table-actions',
  template: ''
})
export class OrganizationTableActionsComponent {
  readonly disabled = input(false);

  readonly editRequested = output<void>();
  readonly removeRequested = output<void>();
}


