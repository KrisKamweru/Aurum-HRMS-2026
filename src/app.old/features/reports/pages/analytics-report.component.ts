import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { ToastService } from '../../../shared/services/toast.service';
import { api } from '../../../../../convex/_generated/api';

type MetricsPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

@Component({
  selector: 'app-analytics-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UiButtonComponent, UiIconComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <a routerLink="/reports" class="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              <ui-icon name="arrow-left" class="w-5 h-5"></ui-icon>
            </a>
            <h1 class="text-2xl font-bold text-stone-900 dark:text-stone-100">Workforce Analytics</h1>
          </div>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400 ml-8">
            Canonical metrics for headcount, attrition, leave liability, and payroll variance
          </p>
        </div>

        <div class="flex items-center gap-2">
          <select
            class="h-10 rounded-lg border border-stone-300 dark:border-stone-700 px-3 bg-white dark:bg-stone-800 text-sm text-stone-700 dark:text-stone-200"
            [ngModel]="period()"
            (ngModelChange)="onPeriodChange($event)"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>

          <ui-button variant="outline" (onClick)="runDueSchedules()" [loading]="runningSchedules()">
            <ui-icon name="clock" class="w-4 h-4 mr-2"></ui-icon>
            Run Due Schedules
          </ui-button>
        </div>
      </div>

      @if (loading()) {
        <div class="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-8 text-center text-stone-500 dark:text-stone-400">
          Loading analytics...
        </div>
      } @else if (metrics()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div class="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4">
            <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Headcount</p>
            <p class="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100">{{ metrics()!.headcount }}</p>
          </div>
          <div class="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4">
            <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Attrition Rate</p>
            <p class="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100">{{ formatPercent(metrics()!.attritionRate) }}</p>
            <p class="text-xs text-stone-500 dark:text-stone-400">Events: {{ metrics()!.attritionCount }}</p>
          </div>
          <div class="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4">
            <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Leave Liability</p>
            <p class="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100">{{ metrics()!.leaveLiabilityDays }} days</p>
          </div>
          <div class="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4">
            <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Payroll Variance</p>
            <p class="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100">{{ formatCurrency(metrics()!.payrollVarianceAmount) }}</p>
            <p class="text-xs text-stone-500 dark:text-stone-400">{{ formatPercent(metrics()!.payrollVariancePercent) }}</p>
          </div>
        </div>

        <div class="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 text-sm text-stone-600 dark:text-stone-400">
          Window: {{ metrics()!.startDate }} to {{ metrics()!.endDate }} ({{ metrics()!.period }})
        </div>
      }
    </div>
  `,
})
export class AnalyticsReportComponent {
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);

  period = signal<MetricsPeriod>('monthly');
  loading = signal(false);
  runningSchedules = signal(false);
  metrics = signal<any | null>(null);

  constructor() {
    this.loadMetrics();
  }

  onPeriodChange(value: MetricsPeriod) {
    this.period.set(value);
    this.loadMetrics();
  }

  async loadMetrics() {
    this.loading.set(true);
    try {
      const data = await this.convex.getClient().query(api.reporting_ops.getCanonicalMetrics, {
        period: this.period(),
      });
      this.metrics.set(data);
    } catch (error: any) {
      this.toast.error(error?.message || 'Failed to load analytics');
      this.metrics.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async runDueSchedules() {
    this.runningSchedules.set(true);
    try {
      const result = await this.convex.getClient().mutation(api.reporting_ops.runDueReportSchedules, { limit: 25 });
      this.toast.success(`Processed ${result.processedCount} schedule(s)`);
    } catch (error: any) {
      this.toast.error(error?.message || 'Failed to run due schedules');
    } finally {
      this.runningSchedules.set(false);
    }
  }

  formatPercent(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
  }

  formatCurrency(value: number): string {
    return `KES ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
