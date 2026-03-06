import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DateRange, UiDateRangeComponent } from '../../../shared/components/ui-date-range/ui-date-range.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-date-picker-demo',
  imports: [UiDateRangeComponent],
  template: `
    <div class="space-y-2 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div>
        <h1 class="text-3xl font-display font-semibold text-slate-900 dark:text-white">Date Range Picker</h1>
        <p class="text-text-muted mt-1">Glassmorphic date range selector with presets and constraints.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 relative z-20">
        <!-- Basic Date Range -->
        <div class="glass-surface rounded-3xl p-6 border border-border-glass space-y-4 overflow-visible">
          <h3 class="text-lg font-display font-semibold text-slate-900 dark:text-white">Basic Range</h3>
          <p class="text-text-muted text-sm">Click to open the dropdown with preset options.</p>
          <ui-date-range
            [startDate]="selectedStart()"
            [endDate]="selectedEnd()"
            (rangeChange)="onRangeChange($event)"
          ></ui-date-range>
          @if (selectedStart()) {
            <div class="text-sm text-slate-600 dark:text-slate-400 mt-2 p-3 rounded-xl bg-(--color-bg-surface-elevated)">
              <span class="font-semibold text-slate-900 dark:text-white">Selected:</span>
              {{ formatDate(selectedStart()!) }} – {{ formatDate(selectedEnd()!) }}
            </div>
          }
        </div>

        <!-- Constrained Range -->
        <div class="glass-surface rounded-3xl p-6 border border-border-glass space-y-4 overflow-visible">
          <h3 class="text-lg font-display font-semibold text-slate-900 dark:text-white">Constrained Range</h3>
          <p class="text-text-muted text-sm">Limited to the last 90 days.</p>
          <ui-date-range
            [startDate]="constrainedStart()"
            [endDate]="constrainedEnd()"
            [minDate]="minDate"
            [maxDate]="maxDate"
            (rangeChange)="onConstrainedRangeChange($event)"
          ></ui-date-range>
          @if (constrainedStart()) {
            <div class="text-sm text-slate-600 dark:text-slate-400 mt-2 p-3 rounded-xl bg-(--color-bg-surface-elevated)">
              <span class="font-semibold text-slate-900 dark:text-white">Selected:</span>
              {{ formatDate(constrainedStart()!) }} – {{ formatDate(constrainedEnd()!) }}
            </div>
          }
        </div>
      </div>

      <!-- Usage Example -->
      <div class="glass-surface rounded-3xl p-6 border border-border-glass">
        <h3 class="text-lg font-display font-semibold text-slate-900 dark:text-white mb-3">Usage</h3>
        <pre class="text-xs p-4 rounded-2xl bg-(--color-bg-surface-elevated) overflow-x-auto text-slate-700 dark:text-slate-300 font-mono"><code>{{ usageExample }}</code></pre>
      </div>
    </div>
  `
})
export class DatePickerDemoComponent {
  readonly selectedStart = signal<Date | null>(null);
  readonly selectedEnd = signal<Date | null>(null);
  readonly constrainedStart = signal<Date | null>(null);
  readonly constrainedEnd = signal<Date | null>(null);

  readonly maxDate = new Date();
  readonly minDate = (() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date;
  })();

  readonly usageExample = `import { Component, signal } from '@angular/core';
import { UiDateRangeComponent, DateRange } from '@shared/components/ui-date-range';

@Component({
  selector: 'app-my-component',
  imports: [UiDateRangeComponent],
  template: \`
    <ui-date-range
      [startDate]="startDate()"
      [endDate]="endDate()"
      [minDate]="minDate"
      [maxDate]="maxDate"
      (rangeChange)="onRangeChange($event)"
    />
  \`
})
export class MyComponent {
  readonly startDate = signal<Date | null>(null);
  readonly endDate = signal<Date | null>(null);
}`;

  onRangeChange(range: DateRange): void {
    this.selectedStart.set(range.start);
    this.selectedEnd.set(range.end);
  }

  onConstrainedRangeChange(range: DateRange): void {
    this.constrainedStart.set(range.start);
    this.constrainedEnd.set(range.end);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
