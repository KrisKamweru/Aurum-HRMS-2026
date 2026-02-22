import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-organization-list-shell',
  template: ''
})
export class OrganizationListShellComponent {
  readonly eyebrow = input('Organization Rebuild');
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly actionMessage = input.required<string>();
}


