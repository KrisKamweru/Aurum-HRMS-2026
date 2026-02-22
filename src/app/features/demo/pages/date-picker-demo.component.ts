import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DateRange, UiDateRangeComponent } from '../../../shared/components/ui-date-range/ui-date-range.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-date-picker-demo',
  imports: [UiDateRangeComponent],
  template: ''
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
