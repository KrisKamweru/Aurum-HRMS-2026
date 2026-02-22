import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type OrganizationLoadingVariant = 'table' | 'linking' | 'chart' | 'detail';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-organization-page-state',
  template: ''
})
export class OrganizationPageStateComponent {
  readonly error = input<string | null>(null);
  readonly isLoading = input(false);
  readonly hasData = input(true);
  readonly loadingLabel = input('Loading data...');
  readonly emptyTitle = input('No records found');
  readonly emptyMessage = input('No records are available for this screen yet.');
  readonly showRetry = input(true);
  readonly retryLabel = input('Retry');
  readonly loadingVariant = input<OrganizationLoadingVariant>('table');
  readonly showEmptyActions = input(false);
  readonly emptyPrimaryLabel = input('Create');
  readonly emptySecondaryLabel = input('Refresh');

  readonly retryRequested = output<void>();
  readonly emptyPrimaryRequested = output<void>();
  readonly emptySecondaryRequested = output<void>();
}


