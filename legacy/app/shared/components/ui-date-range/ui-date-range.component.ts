import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

export interface DateRange {
  start: Date;
  end: Date;
}

export type PresetKey = 'thisMonth' | 'lastMonth' | 'last30' | 'thisYear';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-date-range',
  template: `
    <section class="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
      <div class="flex flex-wrap gap-2">
        @for (preset of presets; track preset.key) {
          <button type="button" class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" [class]="presetClass(preset.key)" (click)="selectPreset(preset.key)">
            {{ preset.label }}
          </button>
        }
      </div>

      <div class="text-sm text-stone-700 dark:text-stone-300">{{ formatRange() }}</div>
    </section>
  `
})
export class UiDateRangeComponent {
  readonly startDate = input<Date | null>(null);
  readonly endDate = input<Date | null>(null);
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);

  readonly rangeChange = output<DateRange>();

  private readonly activePreset = signal<PresetKey | null>(null);
  private readonly selectedStart = signal<Date | null>(null);
  private readonly selectedEnd = signal<Date | null>(null);

  readonly presets: ReadonlyArray<{ key: PresetKey; label: string }> = [
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'last30', label: 'Last 30 Days' },
    { key: 'thisYear', label: 'This Year' }
  ];

  selectPreset(preset: PresetKey): void {
    const today = this.stripTime(new Date());
    let start: Date;
    let end: Date;

    if (preset === 'thisMonth') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = today;
    } else if (preset === 'lastMonth') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (preset === 'thisYear') {
      start = new Date(today.getFullYear(), 0, 1);
      end = today;
    } else {
      end = today;
      start = new Date(today);
      start.setDate(start.getDate() - 30);
    }

    this.selectedStart.set(start);
    this.selectedEnd.set(end);
    this.activePreset.set(preset);
    this.rangeChange.emit({ start, end });
  }

  formatRange(): string {
    const start = this.selectedStart() ?? this.startDate();
    const end = this.selectedEnd() ?? this.endDate();

    if (!start && !end) {
      return 'Select a date range';
    }
    if (start && !end) {
      return `${this.formatDate(start)} - ...`;
    }
    if (start && end) {
      if (this.isSameDay(start, end)) {
        return this.formatDate(start);
      }
      return `${this.formatDate(start)} - ${this.formatDate(end)}`;
    }
    return 'Select a date range';
  }

  presetClass(preset: PresetKey): string {
    if (this.activePreset() === preset) {
      return 'bg-burgundy-700 text-white';
    }
    return 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-white/10 dark:text-stone-300 dark:hover:bg-white/15';
  }

  private formatDate(value: Date): string {
    return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private stripTime(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
}



