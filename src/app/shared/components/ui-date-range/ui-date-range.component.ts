import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DateRange {
  start: Date;
  end: Date;
}

type PresetKey = 'thisMonth' | 'lastMonth' | 'last30' | 'thisYear';

@Component({
  selector: 'ui-date-range',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
      <!-- Quick Presets Bar -->
      <div class="flex gap-2 mb-4 flex-wrap">
        @for (preset of presets; track preset.key) {
          <button
            (click)="selectPreset(preset.key)"
            [class]="getPresetClasses(preset.key)"
            type="button"
          >
            {{ preset.label }}
          </button>
        }
      </div>

      <!-- Month Navigation -->
      <div class="flex items-center justify-between mb-4">
        <button
          (click)="prevMonth()"
          type="button"
          class="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="text-sm font-semibold text-stone-800 dark:text-stone-100">
          {{ leftMonthLabel() }} - {{ rightMonthLabel() }}
        </span>
        <button
          (click)="nextMonth()"
          type="button"
          class="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Dual Calendar Grid -->
      <div class="grid grid-cols-2 gap-6">
        <!-- Left Month -->
        <div class="calendar-month">
          <!-- Day headers -->
          <div class="grid grid-cols-7 mb-2">
            @for (day of dayHeaders; track $index) {
              <div class="text-center text-xs font-semibold text-stone-400 dark:text-stone-500 tracking-wide">
                {{ day }}
              </div>
            }
          </div>
          <!-- Date grid -->
          <div class="grid grid-cols-7 gap-1">
            @for (date of leftMonthDays(); track $index) {
              <button
                type="button"
                [disabled]="!date || isDateDisabled(date)"
                (click)="selectDate(date)"
                (mouseenter)="onDateHover(date)"
                [class]="getDateClasses(date)"
              >
                {{ date ? date.getDate() : '' }}
              </button>
            }
          </div>
        </div>

        <!-- Right Month -->
        <div class="calendar-month">
          <!-- Day headers -->
          <div class="grid grid-cols-7 mb-2">
            @for (day of dayHeaders; track $index) {
              <div class="text-center text-xs font-semibold text-stone-400 dark:text-stone-500 tracking-wide">
                {{ day }}
              </div>
            }
          </div>
          <!-- Date grid -->
          <div class="grid grid-cols-7 gap-1">
            @for (date of rightMonthDays(); track $index) {
              <button
                type="button"
                [disabled]="!date || isDateDisabled(date)"
                (click)="selectDate(date)"
                (mouseenter)="onDateHover(date)"
                [class]="getDateClasses(date)"
              >
                {{ date ? date.getDate() : '' }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Selected Range Display -->
      <div class="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
        <div class="text-sm text-stone-600 dark:text-stone-400">
          {{ formatRange() }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class UiDateRangeComponent {
  // Inputs
  startDate = input<Date | null>(null);
  endDate = input<Date | null>(null);
  minDate = input<Date | null>(null);
  maxDate = input<Date | null>(null);

  // Outputs
  rangeChange = output<DateRange>();

  // Internal state
  protected viewMonth = signal(new Date());
  protected selectingEnd = signal(false);
  protected hoveredDate = signal<Date | null>(null);
  protected activePreset = signal<PresetKey | null>(null);

  protected dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  protected presets = [
    { key: 'thisMonth' as PresetKey, label: 'This Month' },
    { key: 'lastMonth' as PresetKey, label: 'Last Month' },
    { key: 'last30' as PresetKey, label: 'Last 30 Days' },
    { key: 'thisYear' as PresetKey, label: 'This Year' }
  ];

  // Computed values for month labels
  protected leftMonthLabel = computed(() => {
    const date = this.viewMonth();
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  protected rightMonthLabel = computed(() => {
    const date = new Date(this.viewMonth());
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  // Computed values for calendar days
  protected leftMonthDays = computed(() => {
    return this.getDaysInMonth(this.viewMonth());
  });

  protected rightMonthDays = computed(() => {
    const date = new Date(this.viewMonth());
    date.setMonth(date.getMonth() + 1);
    return this.getDaysInMonth(date);
  });

  // Navigation methods
  protected prevMonth() {
    const current = this.viewMonth();
    const prev = new Date(current);
    prev.setMonth(prev.getMonth() - 1);
    this.viewMonth.set(prev);
  }

  protected nextMonth() {
    const current = this.viewMonth();
    const next = new Date(current);
    next.setMonth(next.getMonth() + 1);
    this.viewMonth.set(next);
  }

  // Date selection logic
  protected selectDate(date: Date | null) {
    if (!date || this.isDateDisabled(date)) {
      return;
    }

    this.activePreset.set(null);

    const start = this.startDate();
    const end = this.endDate();

    // If no range exists, or completing a range, start fresh
    if (!start || (start && end)) {
      this.rangeChange.emit({
        start: this.stripTime(date),
        end: this.stripTime(date)
      });
      this.selectingEnd.set(true);
    }
    // If we have a start but no end
    else if (start && !end) {
      const strippedDate = this.stripTime(date);
      const strippedStart = this.stripTime(start);

      // If selected date is before start, make it the new start
      if (strippedDate < strippedStart) {
        this.rangeChange.emit({
          start: strippedDate,
          end: strippedStart
        });
      } else {
        this.rangeChange.emit({
          start: strippedStart,
          end: strippedDate
        });
      }
      this.selectingEnd.set(false);
    }
  }

  protected onDateHover(date: Date | null) {
    if (this.selectingEnd() && date && !this.isDateDisabled(date)) {
      this.hoveredDate.set(date);
    } else {
      this.hoveredDate.set(null);
    }
  }

  // Preset selection
  protected selectPreset(preset: PresetKey) {
    const today = new Date();
    let start: Date;
    let end: Date;

    switch (preset) {
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;

      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month
        break;

      case 'last30':
        end = today;
        start = new Date(today);
        start.setDate(start.getDate() - 30);
        break;

      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
    }

    this.rangeChange.emit({
      start: this.stripTime(start),
      end: this.stripTime(end)
    });
    this.selectingEnd.set(false);
    this.activePreset.set(preset);

    // Navigate to the start month
    this.viewMonth.set(new Date(start));
  }

  // Styling helpers
  protected getPresetClasses(preset: PresetKey): string {
    const isActive = this.activePreset() === preset;

    const baseClasses = `
      px-3 py-1.5 text-xs font-medium rounded-lg
      transition-colors cursor-pointer
    `;

    const activeClasses = isActive
      ? 'bg-burgundy-600 text-white'
      : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-burgundy-100 dark:hover:bg-burgundy-900';

    return `${baseClasses} ${activeClasses}`.replace(/\s+/g, ' ').trim();
  }

  protected getDateClasses(date: Date | null): string {
    if (!date) {
      return 'invisible';
    }

    const start = this.startDate();
    const end = this.endDate();
    const hovered = this.hoveredDate();

    const isStart = start && this.isSameDay(date, start);
    const isEnd = end && this.isSameDay(date, end);
    const isInRange = start && end && this.isInRange(date, start, end);
    const isInHoverRange = this.selectingEnd() && start && hovered &&
                           this.isInRange(date, start, hovered);
    const isDisabled = this.isDateDisabled(date);
    const isToday = this.isSameDay(date, new Date());

    const baseClasses = `
      w-9 h-9 flex items-center justify-center text-sm rounded-full
      transition-colors
    `;

    let stateClasses = '';

    if (isDisabled) {
      stateClasses = 'text-stone-300 dark:text-stone-600 cursor-not-allowed';
    } else if (isStart || isEnd) {
      stateClasses = 'bg-burgundy-600 text-white font-semibold';
    } else if (isInRange) {
      stateClasses = 'bg-burgundy-100 dark:bg-burgundy-900/50 text-burgundy-900 dark:text-burgundy-100';
    } else if (isInHoverRange) {
      stateClasses = 'bg-burgundy-50 dark:bg-burgundy-900/30 text-burgundy-700 dark:text-burgundy-300';
    } else if (isToday) {
      stateClasses = 'border border-burgundy-500 text-burgundy-700 dark:text-burgundy-300 font-medium';
    } else {
      stateClasses = 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer';
    }

    return `${baseClasses} ${stateClasses}`.replace(/\s+/g, ' ').trim();
  }

  protected formatRange(): string {
    const start = this.startDate();
    const end = this.endDate();

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

  // Helper functions
  private getDaysInMonth(date: Date): (Date | null)[] {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Get first day of month and its day of week (0 = Sunday)
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();

    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Create array with leading nulls for proper grid alignment
    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    // Pad to complete weeks (35 or 42 cells total)
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  private isInRange(date: Date, start: Date, end: Date): boolean {
    const stripped = this.stripTime(date);
    const strippedStart = this.stripTime(start);
    const strippedEnd = this.stripTime(end);

    return stripped >= strippedStart && stripped <= strippedEnd;
  }

  protected isDateDisabled(date: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();

    if (min && date < min) {
      return true;
    }

    if (max && date > max) {
      return true;
    }

    return false;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
