import { Component, EventEmitter, Input, Output } from '@angular/core';

export type OrganizationLoadingVariant = 'table' | 'linking' | 'chart' | 'detail';

@Component({
  selector: 'app-organization-page-state',
  standalone: true,
  template: `
    @if (error) {
      <section class="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm">{{ error }}</p>
          @if (showRetry) {
            <button
              type="button"
              class="rounded-[10px] border border-red-300 bg-white/80 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-400/50 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
              (click)="retryRequested.emit()"
            >
              {{ retryLabel }}
            </button>
          }
        </div>
      </section>
    } @else if (isLoading && !hasData) {
      <section class="rounded-2xl border border-stone-200 bg-white px-4 py-6 text-sm text-stone-500 shadow-sm dark:border-white/8 dark:bg-white/[0.04] dark:text-stone-400">
        <p class="text-sm">{{ loadingLabel }}</p>

        @switch (loadingVariant) {
          @case ('chart') {
            <div data-testid="org-loading-skeleton-chart" class="mt-4 space-y-3 animate-pulse">
              <div class="h-4 w-1/3 rounded bg-stone-200 dark:bg-white/10"></div>
              <div class="pl-6 space-y-2">
                <div class="h-3 w-2/5 rounded bg-stone-200 dark:bg-white/10"></div>
                <div class="h-3 w-1/3 rounded bg-stone-200 dark:bg-white/10"></div>
              </div>
              <div class="pl-12 space-y-2">
                <div class="h-3 w-1/3 rounded bg-stone-200 dark:bg-white/10"></div>
              </div>
            </div>
          }
          @case ('detail') {
            <div data-testid="org-loading-skeleton-detail" class="mt-4 grid gap-3 md:grid-cols-2 animate-pulse">
              <div class="space-y-2">
                <div class="h-3 w-1/3 rounded bg-stone-200 dark:bg-white/10"></div>
                <div class="h-4 w-5/6 rounded bg-stone-200 dark:bg-white/10"></div>
              </div>
              <div class="space-y-2">
                <div class="h-3 w-1/3 rounded bg-stone-200 dark:bg-white/10"></div>
                <div class="h-4 w-2/3 rounded bg-stone-200 dark:bg-white/10"></div>
              </div>
              <div class="space-y-2">
                <div class="h-3 w-1/3 rounded bg-stone-200 dark:bg-white/10"></div>
                <div class="h-4 w-1/2 rounded bg-stone-200 dark:bg-white/10"></div>
              </div>
              <div class="space-y-2">
                <div class="h-3 w-1/3 rounded bg-stone-200 dark:bg-white/10"></div>
                <div class="h-4 w-1/2 rounded bg-stone-200 dark:bg-white/10"></div>
              </div>
            </div>
          }
          @case ('linking') {
            <div data-testid="org-loading-skeleton-linking" class="mt-4 space-y-3 animate-pulse">
              <div class="h-9 w-full rounded-lg bg-stone-200 dark:bg-white/10"></div>
              <div class="h-9 w-full rounded-lg bg-stone-200 dark:bg-white/10"></div>
              <div class="h-9 w-1/4 rounded-lg bg-stone-200 dark:bg-white/10"></div>
            </div>
          }
          @default {
            <div data-testid="org-loading-skeleton-table" class="mt-4 space-y-3 animate-pulse">
              <div class="h-7 w-full rounded bg-stone-200 dark:bg-white/10"></div>
              <div class="h-6 w-full rounded bg-stone-200 dark:bg-white/10"></div>
              <div class="h-6 w-full rounded bg-stone-200 dark:bg-white/10"></div>
              <div class="h-6 w-5/6 rounded bg-stone-200 dark:bg-white/10"></div>
            </div>
          }
        }
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
  @Input() showRetry = true;
  @Input() retryLabel = 'Retry';
  @Input() loadingVariant: OrganizationLoadingVariant = 'table';

  @Output() retryRequested = new EventEmitter<void>();
}
