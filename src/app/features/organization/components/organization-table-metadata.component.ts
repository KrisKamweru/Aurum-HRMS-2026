import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-organization-table-metadata',
  standalone: true,
  template: `
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-4 py-3 dark:border-white/[0.05]">
      <p class="text-xs text-stone-500 dark:text-stone-400">
        <span class="font-semibold text-stone-700 dark:text-stone-200">{{ count }}</span>
        {{ itemLabel }}
      </p>
      <p class="text-xs text-stone-500 dark:text-stone-400">
        Last refreshed:
        <span class="font-medium text-stone-700 dark:text-stone-200">{{ lastRefreshedLabel }}</span>
      </p>
    </div>
  `
})
export class OrganizationTableMetadataComponent {
  @Input({ required: true }) itemLabel = '';
  @Input() count = 0;
  @Input() lastRefreshedAt: Date | null = null;

  get lastRefreshedLabel(): string {
    if (!this.lastRefreshedAt) {
      return 'Never';
    }
    return this.formatTimestamp(this.lastRefreshedAt);
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
