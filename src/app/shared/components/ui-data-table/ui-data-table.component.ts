import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { UiBadgeComponent, BadgeVariant } from '../ui-badge/ui-badge.component';

export type ColumnType = 'text' | 'date' | 'currency' | 'badge';

export interface TableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  type?: ColumnType;
  formatter?: (value: unknown, row: Record<string, unknown>) => string;
  badgeVariant?: (value: unknown, row: Record<string, unknown>) => BadgeVariant;
}

export interface SortEvent {
  key: string;
  direction: 'asc' | 'desc';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-data-table',
  imports: [CommonModule, UiBadgeComponent],
  providers: [DatePipe, CurrencyPipe],
  template: `
    <div class="w-full relative overflow-x-auto rounded-2xl glass-surface scrollbar-custom border border-border-glass mx-auto">
      <table class="w-full text-sm text-left">
        <thead class="text-xs font-semibold uppercase tracking-wider text-text-muted sticky top-0 z-20 backdrop-blur-md" [ngClass]="headerClasses()">
          <tr>
            @for (col of columns(); track col.key; let first = $first) {
              <th 
                scope="col" 
                class="px-6 py-4 font-body cursor-pointer select-none whitespace-nowrap transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                [class]="first ? 'sticky left-0 z-30 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md shadow-[1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_rgba(255,255,255,0.05)]' : ''"
                (click)="handleSort(col)"
                [style.width]="col.width"
              >
                <div class="flex items-center gap-2" [class.justify-end]="col.type === 'currency'" [class.justify-center]="col.type === 'badge'">
                  {{ col.header }}
                  @if (col.sortable) {
                    <span class="text-text-muted flex flex-col transition-colors duration-200" [class.text-primary-800]="sortKey === col.key" [class.dark:text-primary-400]="sortKey === col.key">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 transition-transform" [class.rotate-180]="sortKey === col.key && sortDirection === 'desc'"><path d="m6 9 6 6 6-6"/></svg>
                    </span>
                  }
                </div>
              </th>
            }
          </tr>
        </thead>
        <tbody class="divide-y divide-black/5 dark:divide-white/5 text-slate-700 dark:text-slate-300 bg-transparent">
          @if (loading()) {
            <tr>
              <td [attr.colspan]="columns().length" class="px-6 py-16 text-center">
                <div class="flex flex-col items-center justify-center space-y-4">
                  <svg class="w-10 h-10 animate-spin text-primary-800/60 dark:text-primary-500/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span class="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Fetching data...</span>
                </div>
              </td>
            </tr>
          } @else if (data().length === 0) {
            <tr>
              <td [attr.colspan]="columns().length" class="px-6 py-12 text-center text-slate-500">
                <div class="flex flex-col items-center justify-center space-y-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
                  <span>No data available.</span>
                </div>
              </td>
            </tr>
          } @else {
            @for (row of data(); track trackByFn(row, $index)) {
              <tr 
                class="hover:bg-(--color-bg-surface-elevated) transition-colors duration-200 cursor-pointer group"
                (click)="rowClick.emit(row)"
              >
                @for (col of columns(); track col.key; let first = $first) {
                  <td 
                    class="px-6 py-4 whitespace-nowrap font-body"
                    [class]="first ? 'sticky left-0 z-10 font-semibold text-slate-900 dark:text-white bg-slate-50/80 dark:bg-slate-900/80 group-hover:bg-slate-100/90 dark:group-hover:bg-slate-800/90 shadow-[1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_rgba(255,255,255,0.05)] transition-colors duration-200' : 'bg-transparent'"
                    [class.text-right]="col.type === 'currency'"
                    [class.text-center]="col.type === 'badge'"
                  >
                    @if (col.type === 'badge') {
                      <ui-badge [variant]="getBadgeVariant(col, row)" [size]="'sm'">
                        {{ formatValue(col, row) }}
                      </ui-badge>
                    } @else if (col.type === 'currency') {
                      <span class="font-medium">{{ formatValue(col, row) }}</span>
                    } @else {
                      {{ formatValue(col, row) }}
                    }
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `
})
export class UiDataTableComponent {
  private readonly datePipe = inject(DatePipe);
  private readonly currencyPipe = inject(CurrencyPipe);

  readonly data = input<Record<string, unknown>[]>([]);
  readonly columns = input<TableColumn[]>([]);
  readonly loading = input(false);
  readonly headerVariant = input<'accent' | 'neutral' | 'plain'>('accent');

  readonly sortChange = output<SortEvent>();
  readonly rowClick = output<Record<string, unknown>>();

  sortKey: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  handleSort(column: TableColumn): void {
    if (!column.sortable) {
      return;
    }

    if (this.sortKey === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = column.key;
      this.sortDirection = 'asc';
    }

    this.sortChange.emit({ key: column.key, direction: this.sortDirection });
  }

  headerClasses(): string {
    const headerVariant = this.headerVariant();
    if (headerVariant === 'plain') {
      return 'border-b border-black/5 dark:border-white/5 bg-transparent';
    }
    if (headerVariant === 'neutral') {
      return 'bg-slate-50/80 dark:bg-white/5 border-b border-black/5 dark:border-white/5';
    }
    return 'bg-(--color-bg-surface-elevated) border-b border-black/5 dark:border-white/5';
  }

  formatValue(column: TableColumn, row: Record<string, unknown>): string {
    const value = row[column.key];

    if (column.formatter) {
      return column.formatter(value, row);
    }

    if (column.type === 'date') {
      return this.formatDate(value);
    }
    if (column.type === 'currency') {
      return this.formatCurrency(value);
    }
    return value === null || value === undefined ? '' : String(value);
  }

  getBadgeVariant(column: TableColumn, row: Record<string, unknown>): BadgeVariant {
    const value = row[column.key];
    return column.badgeVariant ? column.badgeVariant(value, row) : 'neutral';
  }

  trackByFn(row: Record<string, unknown>, index: number): string | number {
    const id = row['id'] ?? row['_id'];
    if (typeof id === 'string' || typeof id === 'number') {
      return id;
    }
    return "row-" + index;
  }

  formatDate(value: unknown): string {
    if (value instanceof Date) {
      return this.datePipe.transform(value, 'mediumDate') ?? '';
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return this.datePipe.transform(value, 'mediumDate') ?? '';
    }
    return '';
  }

  formatCurrency(value: unknown): string {
    if (typeof value === 'number') {
      return this.currencyPipe.transform(value, 'USD', 'symbol') ?? '';
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return this.currencyPipe.transform(parsed, 'USD', 'symbol') ?? '';
    }
    return '';
  }
}
