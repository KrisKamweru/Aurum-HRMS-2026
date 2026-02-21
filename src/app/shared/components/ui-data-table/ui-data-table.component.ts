import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  selector: 'ui-data-table',
  standalone: true,
  imports: [CommonModule, UiBadgeComponent],
  providers: [DatePipe, CurrencyPipe],
  template: `
    <div class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead [class]="headerClasses()">
            <tr>
              @for (column of columns; track column.key) {
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500" [style.width]="column.width" [class.cursor-pointer]="column.sortable" (click)="handleSort(column)">
                  {{ column.header }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @if (loading) {
              <tr>
                <td [attr.colspan]="columns.length" class="px-4 py-8 text-center text-sm text-stone-500 dark:text-stone-400">Loading data...</td>
              </tr>
            } @else if (data.length === 0) {
              <tr>
                <td [attr.colspan]="columns.length" class="px-4 py-8 text-center text-sm text-stone-500 dark:text-stone-400">No data available</td>
              </tr>
            } @else {
              @for (row of data; track trackByFn(row, $index)) {
                <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]" (click)="rowClick.emit(row)">
                  @for (column of columns; track column.key) {
                    <td class="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">
                      @if (column.type === 'badge') {
                        <ui-badge [variant]="getBadgeVariant(column, row)">{{ formatValue(column, row) }}</ui-badge>
                      } @else {
                        {{ formatValue(column, row) }}
                      }
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class UiDataTableComponent {
  @Input() data: Record<string, unknown>[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() loading = false;
  @Input() headerVariant: 'accent' | 'neutral' | 'plain' = 'accent';

  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() rowClick = new EventEmitter<Record<string, unknown>>();

  private sortKey: string | null = null;
  private sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private readonly datePipe: DatePipe, private readonly currencyPipe: CurrencyPipe) {}

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
    if (this.headerVariant === 'plain') {
      return 'border-b border-stone-200 dark:border-white/8';
    }
    if (this.headerVariant === 'neutral') {
      return 'bg-[#eeedf0] dark:bg-white/[0.02] border-b border-stone-200 dark:border-white/8';
    }
    return 'bg-burgundy-50 dark:bg-burgundy-900/20 border-b border-burgundy-100 dark:border-burgundy-800/30';
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
    return `row-${index}`;
  }

  private formatDate(value: unknown): string {
    if (value instanceof Date) {
      return this.datePipe.transform(value, 'mediumDate') ?? '';
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return this.datePipe.transform(value, 'mediumDate') ?? '';
    }
    return '';
  }

  private formatCurrency(value: unknown): string {
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

