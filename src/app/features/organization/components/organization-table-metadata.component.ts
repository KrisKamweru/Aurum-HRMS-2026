import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-organization-table-metadata',
  template: ''
})
export class OrganizationTableMetadataComponent {
  readonly itemLabel = input.required<string>();
  readonly count = input(0);
  readonly lastRefreshedAt = input<Date | null>(null);

  get lastRefreshedLabel(): string {
    const lastRefreshedAt = this.lastRefreshedAt();
    if (!lastRefreshedAt) {
      return 'Never';
    }
    return this.formatTimestamp(lastRefreshedAt);
  }

  private formatTimestamp(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    const hours = `${value.getHours()}`.padStart(2, '0');
    const minutes = `${value.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}


