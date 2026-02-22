import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DateRange, UiDateRangeComponent } from '../../../shared/components/ui-date-range/ui-date-range.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-date-picker-demo',
  imports: [UiDateRangeComponent],
  template: `
    <div class="space-y-6">
      <header class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy-700 dark:text-burgundy-400">Demo</p>
        <h2 class="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">Date Range Picker</h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          Preset-driven date range selection using the rebuilt ui-date-range component.
        </p>
      </header>

      <section class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/5">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Basic Usage</h3>
        <div class="mt-4 max-w-3xl">
          <ui-date-range [startDate]="selectedStart()" [endDate]="selectedEnd()" (rangeChange)="onRangeChange($event)" />
        </div>
        <div class="mt-4 rounded-xl border border-stone-200 bg-white/70 p-4 text-sm dark:border-white/8 dark:bg-white/[0.03]">
          <p><span class="font-semibold">Start:</span> {{ selectedStart() ? formatDate(selectedStart()!) : 'Not selected' }}</p>
          <p><span class="font-semibold">End:</span> {{ selectedEnd() ? formatDate(selectedEnd()!) : 'Not selected' }}</p>
        </div>
      </section>

      <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">With Constraints</h3>
        <p class="mt-2 text-sm text-stone-600 dark:text-stone-400">Restricted to the last 90 days, no future dates.</p>
        <div class="mt-4 max-w-3xl">
          <ui-date-range
            [startDate]="constrainedStart()"
            [endDate]="constrainedEnd()"
            [minDate]="minDate"
            [maxDate]="maxDate"
            (rangeChange)="onConstrainedRangeChange($event)"
          />
        </div>
        <div class="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm dark:border-white/8 dark:bg-white/[0.03]">
          <p><span class="font-semibold">Start:</span> {{ constrainedStart() ? formatDate(constrainedStart()!) : 'Not selected' }}</p>
          <p><span class="font-semibold">End:</span> {{ constrainedEnd() ? formatDate(constrainedEnd()!) : 'Not selected' }}</p>
        </div>
      </section>

      <section class="rounded-2xl border border-stone-200 bg-[#161514] p-5 shadow-sm dark:border-white/8">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-stone-400">Usage Example</h3>
        <pre class="mt-3 overflow-x-auto text-xs leading-5 text-stone-200"><code>{{ usageExample }}</code></pre>
      </section>
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
