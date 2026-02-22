import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-organization-table-metadata',
  template: `
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-4 py-3 dark:border-white/[0.05]">
      <p class="text-xs text-stone-500 dark:text-stone-400">
        <span class="font-semibold text-stone-700 dark:text-stone-200">{{ count() }}</span>
        {{ itemLabel() }}
      </p>
      <p class="text-xs text-stone-500 dark:text-stone-400">
        Last refreshed:
        <span class="font-medium text-stone-700 dark:text-stone-200">{{ lastRefreshedLabel }}</span>
      </p>
    </div>
  `
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


