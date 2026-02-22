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
  template: ''
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
