import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, TemplateRef, computed, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { UiButtonComponent } from '../ui-button/ui-button.component';
import { UiBadgeComponent, BadgeVariant } from '../ui-badge/ui-badge.component';

export type ColumnType = 'text' | 'date' | 'currency' | 'badge';

export interface TableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  type?: ColumnType;
  formatter?: (value: any, row: any) => string;
  badgeVariant?: (value: any, row: any) => BadgeVariant;
}

export interface SortEvent {
  key: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'ui-data-table',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, UiBadgeComponent],
  providers: [DatePipe, CurrencyPipe],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-500">
          <thead class="bg-gray-50 text-xs uppercase text-gray-700 font-medium">
            <tr>
              @for (col of columns; track col.key) {
                <th
                  class="px-6 py-4 tracking-wider whitespace-nowrap"
                  [class.cursor-pointer]="col.sortable"
                  [class.hover:bg-gray-100]="col.sortable"
                  [style.width]="col.width"
                  (click)="handleSort(col)"
                >
                  <div class="flex items-center gap-1">
                    {{ col.header }}
                    @if (col.sortable) {
                      <div class="flex flex-col">
                        @if (sortKey() === col.key && sortDirection() === 'asc') {
                          <svg class="w-3 h-3 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                          </svg>
                        } @else if (sortKey() === col.key && sortDirection() === 'desc') {
                          <svg class="w-3 h-3 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        } @else {
                          <svg class="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        }
                      </div>
                    }
                  </div>
                </th>
              }
              @if (actionsTemplate) {
                <th class="px-6 py-4 tracking-wider text-right">Actions</th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            @if (loading) {
              <tr>
                <td [attr.colspan]="totalColumns()" class="px-6 py-12 text-center">
                  <div class="flex justify-center">
                    <svg class="animate-spin h-8 w-8 text-rose-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </td>
              </tr>
            } @else if (data.length === 0) {
              <tr>
                <td [attr.colspan]="totalColumns()" class="px-6 py-12 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            } @else {
              @for (row of data; track trackByFn(row)) {
                <tr class="hover:bg-gray-50 transition-colors" (click)="rowClick.emit(row)">
                  @for (col of columns; track col.key) {
                    <td class="px-6 py-4 whitespace-nowrap">
                      <!-- Check for custom template for this column -->
                      @if (getTemplate(col.key); as tpl) {
                        <ng-container *ngTemplateOutlet="tpl; context: { $implicit: row }"></ng-container>
                      } @else {
                        <!-- Badge Type -->
                        @if (col.type === 'badge') {
                          <ui-badge [variant]="getBadgeVariant(col, row)">
                            {{ formatValue(col, row) }}
                          </ui-badge>
                        } @else {
                          <!-- Default / Text / Date / Currency -->
                          {{ formatValue(col, row) }}
                        }
                      }
                    </td>
                  }
                  @if (actionsTemplate) {
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ng-container *ngTemplateOutlet="actionsTemplate; context: { $implicit: row }"></ng-container>
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (pagination) {
        <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing
                <span class="font-medium">{{ (page - 1) * pageSize + 1 }}</span>
                to
                <span class="font-medium">{{ Math.min(page * pageSize, totalItems) }}</span>
                of
                <span class="font-medium">{{ totalItems }}</span>
                results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <ui-button
                  variant="outline"
                  size="sm"
                  class="rounded-l-md rounded-r-none"
                  [disabled]="page === 1"
                  (onClick)="onPageChange(page - 1)"
                >
                  Previous
                </ui-button>
                <ui-button
                  variant="outline"
                  size="sm"
                  class="rounded-l-none rounded-r-md"
                  [disabled]="page * pageSize >= totalItems"
                  (onClick)="onPageChange(page + 1)"
                >
                  Next
                </ui-button>
              </nav>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class UiDataTableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() loading = false;
  @Input() pagination = false;
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() page = 1;
  @Input() actionsTemplate?: TemplateRef<any>;

  // Map of column key to template ref
  @Input() cellTemplates: Record<string, TemplateRef<any>> = {};

  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() rowClick = new EventEmitter<any>();

  protected sortKey = signal<string | null>(null);
  protected sortDirection = signal<'asc' | 'desc'>('asc');

  protected Math = Math;

  constructor(private datePipe: DatePipe, private currencyPipe: CurrencyPipe) {}

  protected totalColumns = computed(() => {
    return this.columns.length + (this.actionsTemplate ? 1 : 0);
  });

  handleSort(col: TableColumn) {
    if (!col.sortable) return;

    const currentKey = this.sortKey();
    const currentDir = this.sortDirection();

    if (currentKey === col.key) {
      if (currentDir === 'asc') {
        this.sortDirection.set('desc');
      } else {
        this.sortKey.set(null);
        this.sortDirection.set('asc');
      }
    } else {
      this.sortKey.set(col.key);
      this.sortDirection.set('asc');
    }

    if (this.sortKey()) {
      this.sortChange.emit({
        key: this.sortKey()!,
        direction: this.sortDirection()
      });
    }
  }

  onPageChange(newPage: number) {
    this.pageChange.emit(newPage);
  }

  getProperty(obj: any, path: string): any {
    return path.split('.').reduce((o, key) => o?.[key], obj);
  }

  getTemplate(key: string): TemplateRef<any> | undefined {
    return this.cellTemplates[key];
  }

  formatValue(col: TableColumn, row: any): string {
    const rawValue = this.getProperty(row, col.key);

    // If custom formatter is provided, use it
    if (col.formatter) {
      return col.formatter(rawValue, row);
    }

    // Default formatting based on type
    switch (col.type) {
      case 'date':
        return this.datePipe.transform(rawValue, 'mediumDate') || '';
      case 'currency':
        return this.currencyPipe.transform(rawValue, 'USD', 'symbol') || '';
      case 'text':
      case 'badge': // Badge text content
      default:
        return rawValue !== null && rawValue !== undefined ? String(rawValue) : '';
    }
  }

  getBadgeVariant(col: TableColumn, row: any): BadgeVariant {
    const rawValue = this.getProperty(row, col.key);
    if (col.badgeVariant) {
      return col.badgeVariant(rawValue, row);
    }
    return 'neutral';
  }

  trackByFn(item: any): any {
    return item.id || item._id || item;
  }
}
