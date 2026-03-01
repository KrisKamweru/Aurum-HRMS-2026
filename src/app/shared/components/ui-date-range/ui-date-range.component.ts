import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

export interface DateRange {
  start: Date;
  end: Date;
}

export type PresetKey = 'thisMonth' | 'lastMonth' | 'last30' | 'thisYear';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-date-range',
  imports: [CommonModule, UiIconComponent],
  template: `
    <div class="relative w-full max-w-sm group">
      <!-- Input Trigger -->
      <div 
        class="flex items-center justify-between w-full px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 border bg-[var(--color-bg-surface-elevated)] border-black/10 text-slate-700 shadow-sm glass-surface-hover dark:border-white/10 dark:text-slate-300"
      >
        <div class="flex items-center gap-3">
          <ui-icon name="calendar" class="w-5 h-5 text-slate-400 dark:text-slate-500"></ui-icon>
          <span class="text-sm font-medium">{{ formatRange() }}</span>
        </div>
        <ui-icon name="chevron-down" class="w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-300 group-hover:text-primary-500"></ui-icon>
      </div>
      
      <!-- Dropdown Panel -->
      <div class="absolute left-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-[32rem] max-w-[32rem] rounded-[24px] glass-surface shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-left flex flex-col sm:flex-row">
        
        <!-- Presets Sidebar -->
        <div class="w-full sm:w-40 bg-transparent border-b sm:border-b-0 sm:border-r border-black/5 dark:border-white/5 p-4 flex flex-row sm:flex-col gap-2 overflow-x-auto scrollbar-none">
          <div class="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1 hidden sm:block px-2">Presets</div>
          @for (preset of presets; track preset.key) {
            <button
              (click)="selectPreset(preset.key); $event.stopPropagation()"
              class="px-3 py-2 rounded-xl text-sm font-semibold text-left transition-colors whitespace-nowrap outline-none"
              [class]="activePreset() === preset.key 
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'"
            >
              {{ preset.label }}
            </button>
          }
        </div>
        
        <!-- Date Display Area (Mock Calendar) -->
        <div class="flex-1 p-6 bg-transparent relative">
          <div class="flex justify-between items-center mb-6">
            <h4 class="text-base font-display font-semibold text-slate-900 dark:text-white">Custom Range</h4>
            <div class="flex gap-2">
              <button class="p-1.5 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 transition-colors">
                <ui-icon name="chevron-left" class="w-4 h-4"></ui-icon>
              </button>
              <button class="p-1.5 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 transition-colors">
                <ui-icon name="chevron-right" class="w-4 h-4"></ui-icon>
              </button>
            </div>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-6 relative sm:before:absolute sm:before:left-1/2 sm:before:top-0 sm:before:bottom-0 sm:before:w-px sm:before:bg-black/5 sm:dark:before:bg-white/5">
            <div class="flex-1">
              <div class="font-medium text-slate-900 dark:text-white text-sm mb-3">Start Date</div>
              <div class="w-full aspect-[4/3] flex items-center justify-center text-slate-400/50 dark:text-slate-500/50 py-6 text-xs font-medium tracking-wide uppercase border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                Calendar Grid
              </div>
            </div>
            <div class="flex-1">
               <div class="font-medium text-slate-900 dark:text-white text-sm mb-3">End Date</div>
               <div class="w-full aspect-[4/3] flex items-center justify-center text-slate-400/50 dark:text-slate-500/50 py-6 text-xs font-medium tracking-wide uppercase border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                Calendar Grid
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UiDateRangeComponent {
  readonly startDate = input<Date | null>(null);
  readonly endDate = input<Date | null>(null);
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);

  readonly rangeChange = output<DateRange>();

  readonly activePreset = signal<PresetKey | null>(null);
  readonly selectedStart = signal<Date | null>(null);
  readonly selectedEnd = signal<Date | null>(null);

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



