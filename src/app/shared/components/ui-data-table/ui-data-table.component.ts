import { Component, Input, Output, EventEmitter, TemplateRef, computed, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { UiButtonComponent } from '../ui-button/ui-button.component';
import { UiBadgeComponent, BadgeVariant } from '../ui-badge/ui-badge.component';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

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
  imports: [CommonModule, UiButtonComponent, UiBadgeComponent, UiIconComponent],
  providers: [DatePipe, CurrencyPipe],
  template: `
    <div class="bg-white dark:bg-stone-800 rounded-2xl shadow-lg shadow-stone-200/50 dark:shadow-black/20 border border-stone-200 dark:border-stone-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-burgundy-50 dark:bg-burgundy-900/20 border-b border-burgundy-100 dark:border-burgundy-800/30">
            <tr>
              @for (col of columns; track col.key) {
                <th
                  class="px-6 py-4 text-xs font-bold text-burgundy-800 dark:text-burgundy-200 uppercase tracking-wider whitespace-nowrap"
                  [class.cursor-pointer]="col.sortable"
                  [class.hover:text-burgundy-900]="col.sortable"
                  [class.dark:hover:text-burgundy-100]="col.sortable"
                  [style.width]="col.width"
                  (click)="handleSort(col)"
                >
                  <div class="flex items-center gap-2">
                    {{ col.header }}
                    @if (col.sortable) {
                      <div class="flex flex-col">
                        @if (sortKey() === col.key && sortDirection() === 'asc') {
                          <ui-icon name="chevron-up" class="w-4 h-4 text-burgundy-800 dark:text-burgundy-200"></ui-icon>
                        } @else if (sortKey() === col.key && sortDirection() === 'desc') {
                          <ui-icon name="chevron-down" class="w-4 h-4 text-burgundy-800 dark:text-burgundy-200"></ui-icon>
                        } @else {
                          <ui-icon name="selector" class="w-4 h-4 text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity"></ui-icon>
                        }
                      </div>
                    }
                  </div>
                </th>
              }
              @if (actionsTemplate) {
                <th class="px-6 py-4 text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider text-right">Actions</th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100 dark:divide-stone-700">
            @if (loading) {
              <tr>
                <td [attr.colspan]="totalColumns()" class="px-6 py-16 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="relative">
                      <div class="w-12 h-12 rounded-full border-4 border-stone-100 dark:border-stone-700 border-t-burgundy-800 dark:border-t-burgundy-500 animate-spin"></div>
                    </div>
                    <p class="text-sm text-stone-500 dark:text-stone-400">Loading data...</p>
                  </div>
                </td>
              </tr>
            } @else if (data.length === 0) {
              <tr>
                <td [attr.colspan]="totalColumns()" class="px-6 py-16 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                      <ui-icon name="inbox" class="w-8 h-8 text-stone-400 dark:text-stone-500"></ui-icon>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-stone-700 dark:text-stone-300">No data available</p>
                      <p class="text-xs text-stone-500 dark:text-stone-400 mt-1">Add some records to see them here</p>
                    </div>
                  </div>
                </td>
              </tr>
            } @else {
              @for (row of data; track trackByFn(row); let i = $index) {
                <tr
                  class="hover:bg-gradient-to-r hover:from-burgundy-50 hover:to-transparent dark:hover:from-burgundy-900/10 dark:hover:to-transparent transition-all duration-200 cursor-pointer group"
                  [class.animate-fade-in-up]="true"
                  [style.animation-delay.ms]="i * 30"
                  (click)="rowClick.emit(row)"
                >
                  @for (col of columns; track col.key) {
                    <td class="px-6 py-4 whitespace-nowrap text-stone-700 dark:text-stone-300">
                      @if (getTemplate(col.key); as tpl) {
                        <ng-container *ngTemplateOutlet="tpl; context: { $implicit: row }"></ng-container>
                      } @else {
                        @if (col.type === 'badge') {
                          <ui-badge [variant]="getBadgeVariant(col, row)">
                            {{ formatValue(col, row) }}
                          </ui-badge>
                        } @else {
                          <span class="text-stone-800 dark:text-stone-200">{{ formatValue(col, row) }}</span>
                        }
                      }
                    </td>
                  }
                  @if (actionsTemplate) {
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <ng-container *ngTemplateOutlet="actionsTemplate; context: { $implicit: row }"></ng-container>
                      </div>
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (pagination && data.length > 0) {
        <div class="bg-stone-50 dark:bg-stone-900/50 px-6 py-4 flex items-center justify-between border-t border-stone-200 dark:border-stone-700">
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-stone-600 dark:text-stone-400">
                Showing
                <span class="font-semibold text-stone-800 dark:text-stone-200">{{ (page - 1) * pageSize + 1 }}</span>
                to
                <span class="font-semibold text-stone-800 dark:text-stone-200">{{ Math.min(page * pageSize, totalItems) }}</span>
                of
                <span class="font-semibold text-stone-800 dark:text-stone-200">{{ totalItems }}</span>
                results
              </p>
            </div>
            <div class="flex items-center gap-2">
              <ui-button
                variant="outline"
                size="sm"
                [disabled]="page === 1"
                (onClick)="onPageChange(page - 1)"
              >
                <ui-icon name="chevron-left" class="w-4 h-4 mr-1"></ui-icon>
                Previous
              </ui-button>
              <ui-button
                variant="outline"
                size="sm"
                [disabled]="page * pageSize >= totalItems"
                (onClick)="onPageChange(page + 1)"
              >
                Next
                <ui-icon name="chevron-right" class="w-4 h-4 ml-1"></ui-icon>
              </ui-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .animate-fade-in-up {
      animation: fadeInUp 0.3s ease-out forwards;
      opacity: 0;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
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

    if (col.formatter) {
      return col.formatter(rawValue, row);
    }

    switch (col.type) {
      case 'date':
        return this.datePipe.transform(rawValue, 'mediumDate') || '';
      case 'currency':
        return this.currencyPipe.transform(rawValue, 'USD', 'symbol') || '';
      case 'text':
      case 'badge':
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
