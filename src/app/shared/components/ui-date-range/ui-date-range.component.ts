import { ChangeDetectionStrategy, Component, computed, HostListener, input, output, signal } from '@angular/core';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

export interface DateRange {
  start: Date;
  end: Date;
}

export type PresetKey = 'thisMonth' | 'lastMonth' | 'last30' | 'thisYear';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-date-range',
  imports: [UiIconComponent],
  template: `
    <div class="relative w-full max-w-sm">
      <!-- Input Trigger -->
      <div 
        class="flex items-center justify-between w-full px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 border bg-(--color-bg-surface-elevated) border-border-glass text-slate-700 dark:text-slate-300 hover:border-primary-500/30"
        (click)="toggleDropdown($event)"
      >
        <div class="flex items-center gap-3">
          <ui-icon name="calendar" class="w-5 h-5 text-slate-400 dark:text-slate-500"></ui-icon>
          <span class="text-sm font-medium">{{ formatRange() }}</span>
        </div>
        <ui-icon name="chevron-down" class="w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-300" [class.rotate-180]="isDropdownOpen()"></ui-icon>
      </div>
      
      <!-- Dropdown Panel -->
      @if (isDropdownOpen()) {
        <div 
          class="absolute left-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-xl max-w-xl rounded-[24px] border border-border-glass overflow-hidden z-999 transition-all duration-300 transform origin-top-left flex flex-col sm:flex-row bg-white dark:bg-slate-900 shadow-xl shadow-black/10 dark:shadow-black/40"
          (click)="$event.stopPropagation()"
        >
          
          <!-- Presets Sidebar -->
          <div class="w-full sm:w-36 border-b sm:border-b-0 sm:border-r border-border-glass p-3 flex flex-row sm:flex-col gap-1 overflow-x-auto scrollbar-none">
            <div class="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1 hidden sm:block px-2">Presets</div>
            @for (preset of presets; track preset.key) {
              <button
                (click)="selectPreset(preset.key)"
                class="px-3 py-2 rounded-xl text-sm font-semibold text-left transition-colors whitespace-nowrap outline-none"
                [class]="activePreset() === preset.key 
                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'"
              >
                {{ preset.label }}
              </button>
            }
          </div>
          
          <!-- Calendar Area -->
          <div class="flex-1 p-4">
            <!-- Month Navigation -->
            <div class="flex justify-between items-center mb-3">
              <button class="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 transition-colors" (click)="prevMonth()">
                <ui-icon name="chevron-left" class="w-4 h-4"></ui-icon>
              </button>
              <div class="flex gap-6">
                <span class="text-sm font-display font-semibold text-slate-900 dark:text-white">{{ leftMonthLabel() }}</span>
                <span class="text-sm font-display font-semibold text-slate-900 dark:text-white">{{ rightMonthLabel() }}</span>
              </div>
              <button class="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 transition-colors" (click)="nextMonth()">
                <ui-icon name="chevron-right" class="w-4 h-4"></ui-icon>
              </button>
            </div>

            <!-- Two-Month Grid -->
            <div class="flex gap-4">
              <!-- Left Month -->
              <div class="flex-1">
                <div class="grid grid-cols-7 mb-1">
                  @for (d of weekDays; track d) {
                    <div class="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase py-1">{{ d }}</div>
                  }
                </div>
                <div class="grid grid-cols-7">
                  @for (day of leftMonthDays(); track day.date.getTime()) {
                    <button
                      class="h-8 w-full text-xs font-medium rounded-lg transition-colors relative"
                      [class]="getDayClasses(day)"
                      [disabled]="day.isDisabled"
                      (click)="selectDay(day.date)"
                    >
                      {{ day.isCurrentMonth ? day.day : '' }}
                    </button>
                  }
                </div>
              </div>

              <!-- Divider -->
              <div class="w-px bg-border-glass hidden sm:block"></div>

              <!-- Right Month -->
              <div class="flex-1 hidden sm:block">
                <div class="grid grid-cols-7 mb-1">
                  @for (d of weekDays; track d) {
                    <div class="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase py-1">{{ d }}</div>
                  }
                </div>
                <div class="grid grid-cols-7">
                  @for (day of rightMonthDays(); track day.date.getTime()) {
                    <button
                      class="h-8 w-full text-xs font-medium rounded-lg transition-colors relative"
                      [class]="getDayClasses(day)"
                      [disabled]="day.isDisabled"
                      (click)="selectDay(day.date)"
                    >
                      {{ day.isCurrentMonth ? day.day : '' }}
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class UiDateRangeComponent {
  readonly startDate = input<Date | null>(null);
  readonly endDate = input<Date | null>(null);
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);

  readonly rangeChange = output<DateRange>();

  readonly isDropdownOpen = signal(false);
  readonly activePreset = signal<PresetKey | null>(null);
  readonly selectedStart = signal<Date | null>(null);
  readonly selectedEnd = signal<Date | null>(null);
  readonly viewMonth = signal(new Date());

  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  readonly presets: ReadonlyArray<{ key: PresetKey; label: string }> = [
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'last30', label: 'Last 30 Days' },
    { key: 'thisYear', label: 'This Year' }
  ];

  readonly leftMonthLabel = computed(() => {
    const d = this.viewMonth();
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  readonly rightMonthLabel = computed(() => {
    const d = this.viewMonth();
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return next.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  readonly leftMonthDays = computed(() => this.buildCalendarDays(this.viewMonth()));

  readonly rightMonthDays = computed(() => {
    const d = this.viewMonth();
    return this.buildCalendarDays(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  });

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.isDropdownOpen()) {
      this.isDropdownOpen.set(false);
    }
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isDropdownOpen.update(v => !v);
  }

  prevMonth(): void {
    const d = this.viewMonth();
    this.viewMonth.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.viewMonth();
    this.viewMonth.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  selectDay(date: Date): void {
    const start = this.selectedStart();
    const end = this.selectedEnd();

    if (!start || (start && end)) {
      // First click or reset: set start
      this.selectedStart.set(date);
      this.selectedEnd.set(null);
      this.activePreset.set(null);
    } else {
      // Second click: set end
      if (date < start) {
        this.selectedEnd.set(start);
        this.selectedStart.set(date);
      } else {
        this.selectedEnd.set(date);
      }
      this.rangeChange.emit({ start: this.selectedStart()!, end: this.selectedEnd()! });
    }
  }

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
    this.viewMonth.set(new Date(start.getFullYear(), start.getMonth(), 1));
    this.rangeChange.emit({ start, end });
  }

  formatRange(): string {
    const start = this.selectedStart() ?? this.startDate();
    const end = this.selectedEnd() ?? this.endDate();

    if (!start && !end) return 'Select a date range';
    if (start && !end) return `${this.fmtDate(start)} — ...`;
    if (start && end) {
      if (this.isSameDay(start, end)) return this.fmtDate(start);
      return `${this.fmtDate(start)} — ${this.fmtDate(end)}`;
    }
    return 'Select a date range';
  }

  getDayClasses(day: CalendarDay): string {
    if (!day.isCurrentMonth) return 'text-transparent cursor-default';
    if (day.isDisabled) return 'text-slate-300 dark:text-slate-600 cursor-not-allowed';

    const parts: string[] = [];

    if (day.isRangeStart || day.isRangeEnd) {
      parts.push('bg-primary-800 text-white dark:bg-primary-600 font-bold');
    } else if (day.isInRange) {
      parts.push('bg-primary-100 text-primary-900 dark:bg-primary-900/30 dark:text-primary-200');
    } else if (day.isToday) {
      parts.push('ring-1 ring-primary-500 text-primary-700 dark:text-primary-400 font-bold');
    } else {
      parts.push('text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10');
    }

    return parts.join(' ');
  }

  private buildCalendarDays(monthDate: Date): CalendarDay[] {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = this.stripTime(new Date());
    const start = this.selectedStart();
    const end = this.selectedEnd();
    const min = this.minDate();
    const max = this.maxDate();

    const days: CalendarDay[] = [];

    // Padding days from previous month
    for (let i = 0; i < firstDay; i++) {
      const d = new Date(year, month, -(firstDay - 1 - i));
      days.push(this.makeDay(d, false, today, start, end, min, max));
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push(this.makeDay(date, true, today, start, end, min, max));
    }

    // Padding days to fill 6 rows
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push(this.makeDay(d, false, today, start, end, min, max));
    }

    return days;
  }

  private makeDay(date: Date, isCurrentMonth: boolean, today: Date, start: Date | null, end: Date | null, min: Date | null, max: Date | null): CalendarDay {
    const isSel = (start && this.isSameDay(date, start)) || (end && this.isSameDay(date, end));
    const isInRange = start && end && date > start && date < end;
    const isDisabled = (min && date < min) || (max && date > max) || false;

    return {
      date,
      day: date.getDate(),
      isCurrentMonth,
      isToday: this.isSameDay(date, today),
      isDisabled,
      isSelected: !!isSel,
      isInRange: !!isInRange,
      isRangeStart: !!(start && this.isSameDay(date, start)),
      isRangeEnd: !!(end && this.isSameDay(date, end))
    };
  }

  private fmtDate(value: Date): string {
    return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private stripTime(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
}
