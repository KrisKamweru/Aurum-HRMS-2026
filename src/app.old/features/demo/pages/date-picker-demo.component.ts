import { Component, signal } from '@angular/core';
import { UiDateRangeComponent, DateRange } from '../../../shared/components/ui-date-range/ui-date-range.component';

@Component({
  selector: 'app-date-picker-demo',
  standalone: true,
  imports: [UiDateRangeComponent],
  template: `
    <div class="max-w-5xl">
      <h1 class="text-3xl font-bold text-stone-900 dark:text-white mb-2">Date Range Picker</h1>
      <p class="text-stone-600 dark:text-stone-400 mb-8">
        Inline dual-month calendar with quick presets for selecting date ranges.
      </p>

      <!-- Basic Date Range Picker -->
      <section class="mb-12">
        <h2 class="text-xl font-semibold text-stone-900 dark:text-white mb-4">Basic Usage</h2>

        <div class="max-w-3xl">
          <ui-date-range
            [startDate]="selectedStart()"
            [endDate]="selectedEnd()"
            (rangeChange)="onRangeChange($event)"
          />
        </div>

        <div class="mt-6 p-4 bg-stone-100 dark:bg-stone-800 rounded-lg">
          <h3 class="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Selected Range:</h3>
          <div class="text-sm text-stone-600 dark:text-stone-400">
            <p><strong>Start:</strong> {{ selectedStart() ? formatDate(selectedStart()!) : 'Not selected' }}</p>
            <p><strong>End:</strong> {{ selectedEnd() ? formatDate(selectedEnd()!) : 'Not selected' }}</p>
          </div>
        </div>
      </section>

      <!-- With Min/Max Constraints -->
      <section class="mb-12">
        <h2 class="text-xl font-semibold text-stone-900 dark:text-white mb-4">With Date Constraints</h2>
        <p class="text-sm text-stone-600 dark:text-stone-400 mb-4">
          Date range restricted to the last 90 days and no future dates.
        </p>

        <div class="max-w-3xl">
          <ui-date-range
            [startDate]="constrainedStart()"
            [endDate]="constrainedEnd()"
            [minDate]="minDate"
            [maxDate]="maxDate"
            (rangeChange)="onConstrainedRangeChange($event)"
          />
        </div>

        <div class="mt-6 p-4 bg-stone-100 dark:bg-stone-800 rounded-lg">
          <h3 class="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Selected Range:</h3>
          <div class="text-sm text-stone-600 dark:text-stone-400">
            <p><strong>Start:</strong> {{ constrainedStart() ? formatDate(constrainedStart()!) : 'Not selected' }}</p>
            <p><strong>End:</strong> {{ constrainedEnd() ? formatDate(constrainedEnd()!) : 'Not selected' }}</p>
          </div>
        </div>
      </section>

      <!-- Usage Example -->
      <section>
        <h2 class="text-xl font-semibold text-stone-900 dark:text-white mb-4">Usage Example</h2>

        <div class="bg-stone-800 rounded-lg p-6 overflow-x-auto">
          <pre class="text-sm text-stone-100"><code>{{ usageExample }}</code></pre>
        </div>
      </section>
    </div>
  `
})
export class DatePickerDemoComponent {
  // Basic usage
  protected selectedStart = signal<Date | null>(null);
  protected selectedEnd = signal<Date | null>(null);

  // Constrained usage
  protected constrainedStart = signal<Date | null>(null);
  protected constrainedEnd = signal<Date | null>(null);

  // Constraints: last 90 days to today
  protected maxDate = new Date();
  protected minDate = (() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date;
  })();

  protected onRangeChange(range: DateRange) {
    this.selectedStart.set(range.start);
    this.selectedEnd.set(range.end);
  }

  protected onConstrainedRangeChange(range: DateRange) {
    this.constrainedStart.set(range.start);
    this.constrainedEnd.set(range.end);
  }

  protected formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  protected usageExample = `import { Component, signal } from '@angular/core';
import { UiDateRangeComponent, DateRange } from '@shared/components/ui-date-range';

@Component({
  selector: 'app-my-component',
  standalone: true,
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
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);

  minDate = new Date('2024-01-01');
  maxDate = new Date();

  onRangeChange(range: DateRange) {
    this.startDate.set(range.start);
    this.endDate.set(range.end);
    console.log('Range selected:', range);
  }
}`;
}
