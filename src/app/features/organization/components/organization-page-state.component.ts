import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-organization-page-state',
  standalone: true,
  template: `
    @if (error) {
      <section class="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
        {{ error }}
      </section>
    } @else if (isLoading && !hasData) {
      <section class="rounded-2xl border border-stone-200 bg-white px-4 py-6 text-sm text-stone-500 shadow-sm dark:border-white/8 dark:bg-white/[0.04] dark:text-stone-400">
        {{ loadingLabel }}
      </section>
    } @else if (!isLoading && !hasData) {
      <section class="rounded-2xl border border-dashed border-stone-300 bg-white/90 px-4 py-8 text-center shadow-sm dark:border-white/12 dark:bg-white/[0.04]">
        <h2 class="text-sm font-semibold text-stone-700 dark:text-stone-200">{{ emptyTitle }}</h2>
        <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">{{ emptyMessage }}</p>
      </section>
    }
  `
})
export class OrganizationPageStateComponent {
  @Input() error: string | null = null;
  @Input() isLoading = false;
  @Input() hasData = true;
  @Input() loadingLabel = 'Loading data...';
  @Input() emptyTitle = 'No records found';
  @Input() emptyMessage = 'No records are available for this screen yet.';
}
