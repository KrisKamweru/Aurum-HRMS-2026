import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsPeriod } from '../data/reports-rebuild.models';
import { ReportsRebuildStore } from '../data/reports-rebuild.store';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reports-analytics-rebuild',
  imports: [RouterLink, UiButtonComponent, UiIconComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <a routerLink="/reports" class="text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
              <ui-icon name="arrow-left" class="h-4 w-4"></ui-icon>
            </a>
            <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Workforce Analytics</h1>
          </div>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Canonical metrics for headcount, attrition, leave liability, and payroll variance.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <select
            class="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/[0.03] dark:text-white"
            [value]="selectedPeriod()"
            (change)="setPeriod($event)"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <ui-button variant="outline" size="sm" [disabled]="scheduleRunning()" (onClick)="runDueSchedules()">
            Run Due Schedules
          </ui-button>
        </div>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          {{ error() }}
        </section>
      }
      @if (scheduleMessage()) {
        <section class="mb-4 rounded-2xl border border-burgundy-200 bg-burgundy-50 p-4 text-sm text-burgundy-700 dark:border-burgundy-700/30 dark:bg-burgundy-900/20 dark:text-burgundy-300">
          {{ scheduleMessage() }}
        </section>
      }

      @if (analyticsLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-4 w-40 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-28 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else if (analytics()) {
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Headcount</p>
            <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ analytics()!.headcount }}</p>
          </article>
          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Attrition</p>
            <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ percent(analytics()!.attritionRate) }}</p>
            <p class="mt-1 text-xs text-stone-500 dark:text-stone-400">{{ analytics()!.attritionCount }} events</p>
          </article>
          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Leave Liability</p>
            <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ analytics()!.leaveLiabilityDays }} days</p>
          </article>
          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Payroll Variance</p>
            <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ money(analytics()!.payrollVarianceAmount) }}</p>
            <p class="mt-1 text-xs text-stone-500 dark:text-stone-400">{{ percent(analytics()!.payrollVariancePercent) }}</p>
          </article>
        </section>
      }
    </main>
  `
})
export class ReportsAnalyticsRebuildComponent implements OnInit {
  private readonly store = inject(ReportsRebuildStore);

  readonly analytics = this.store.analytics;
  readonly analyticsLoading = this.store.analyticsLoading;
  readonly scheduleRunning = this.store.scheduleRunning;
  readonly error = this.store.error;
  readonly selectedPeriod = signal<AnalyticsPeriod>('monthly');
  readonly scheduleMessage = signal<string | null>(null);

  ngOnInit(): void {
    void this.store.loadAnalytics(this.selectedPeriod());
  }

  setPeriod(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    const period = this.normalizePeriod(target.value);
    this.selectedPeriod.set(period);
    void this.store.loadAnalytics(period);
  }

  async runDueSchedules(): Promise<void> {
    const count = await this.store.runDueSchedules(25);
    this.scheduleMessage.set(`Processed ${count} due report schedule(s).`);
  }

  percent(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
  }

  money(value: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);
  }

  private normalizePeriod(value: string): AnalyticsPeriod {
    if (value === 'daily' || value === 'weekly' || value === 'monthly' || value === 'quarterly') {
      return value;
    }
    return 'monthly';
  }
}
