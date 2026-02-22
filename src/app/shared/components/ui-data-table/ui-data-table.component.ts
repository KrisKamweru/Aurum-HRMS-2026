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
  template: ''
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

  private sortKey: string | null = null;
  private sortDirection: 'asc' | 'desc' = 'asc';

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
      return 'border-b border-stone-200 dark:border-white/8';
    }
    if (headerVariant === 'neutral') {
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



