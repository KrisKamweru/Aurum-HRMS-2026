import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { SortEvent, TableColumn, UiDataTableComponent } from '../../../shared/components/ui-data-table/ui-data-table.component';
import { ToastMessage, UiToastComponent } from '../../../shared/components/ui-toast/ui-toast.component';

type DemoRole = 'Admin' | 'Manager' | 'User';
type DemoStatus = 'Active' | 'Inactive';
type DemoUserSortableKey = 'name' | 'email' | 'lastLogin' | 'salary';

interface DemoUserRow extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
  role: DemoRole;
  status: DemoStatus;
  lastLogin: Date;
  salary: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tables-demo',
  imports: [UiDataTableComponent, UiButtonComponent, UiCardComponent, UiToastComponent],
  template: `
    <div class="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-display font-semibold text-slate-900 dark:text-white">Data Tables</h1>
          <p class="text-slate-500 mt-1">High-density information display using glass surfaces.</p>
        </div>
        <div class="flex gap-3">
          <ui-button variant="secondary" (click)="toggleLoading()">
            {{ loading() ? 'Stop Loading' : 'Simulate Loading' }}
          </ui-button>
          <ui-button variant="secondary" icon="x-mark" (click)="resetRows()">Reset</ui-button>
        </div>
      </div>

      <ui-card variant="interactive" padding="none">
        <div class="p-6 border-b border-white/40 dark:border-white/10 flex justify-between items-center bg-white/20 dark:bg-white/5">
          <h3 class="font-display font-medium text-lg text-slate-800 dark:text-slate-200">Employee Directory</h3>
          <div class="flex gap-2">
            <input type="text" placeholder="Search employees..." class="px-4 py-2 rounded-full bg-white/50 dark:bg-black/20 border border-white/60 dark:border-white/10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all placeholder:text-slate-400 text-sm w-64 glass-surface-hover shadow-sm" />
          </div>
        </div>
        
        <div class="p-0">
          <ui-data-table 
            [columns]="columns" 
            [data]="rows()" 
            [loading]="loading()"
            [headerVariant]="'plain'"
            (sortChange)="onSort($event)"
            (rowClick)="onRowClick($event)"
          ></ui-data-table>
        </div>
        
        @if (selectedRowName()) {
          <div class="p-4 bg-primary-50/50 dark:bg-primary-900/10 border-t border-primary-100/50 dark:border-primary-800/20 text-sm text-primary-800 dark:text-primary-300 flex items-center gap-2 rounded-b-2xl">
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
            <span>Selected employee: <strong>{{ selectedRowName() }}</strong></span>
          </div>
        }
      </ui-card>
    </div>

    <ui-toast [toasts]="toasts()" (dismiss)="dismissToast($event)"></ui-toast>
  `
})
export class TablesDemoComponent {
  readonly loading = signal(false);
  readonly selectedRowName = signal<string | null>(null);
  readonly toasts = signal<ToastMessage[]>([]);

  readonly columns: TableColumn[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'role',
      header: 'Role',
      type: 'badge',
      badgeVariant: (value) => (value === 'Admin' ? 'primary' : value === 'Manager' ? 'info' : 'neutral')
    },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      badgeVariant: (value) => (value === 'Active' ? 'success' : 'danger')
    },
    { key: 'lastLogin', header: 'Last Login', type: 'date', sortable: true },
    { key: 'salary', header: 'Salary', type: 'currency', sortable: true }
  ];

  readonly rows = signal<DemoUserRow[]>(this.buildInitialRows());

  onSort(event: SortEvent): void {
    if (!this.isSortableKey(event.key)) {
      return;
    }
    const key = event.key;
    const direction = event.direction === 'asc' ? 1 : -1;
    this.rows.update((rows) => [...rows].sort((a, b) => this.compareRows(a, b, key) * direction));
    this.pushToast('info', `Sorted by ${event.key} (${event.direction})`);
  }

  onRowClick(row: Record<string, unknown>): void {
    const name = typeof row['name'] === 'string' ? row['name'] : 'Unknown';
    this.selectedRowName.set(name);
    this.pushToast('success', `Selected ${name}`);
  }

  toggleLoading(): void {
    this.loading.update((value) => !value);
  }

  resetRows(): void {
    this.rows.set(this.buildInitialRows());
    this.selectedRowName.set(null);
    this.pushToast('warning', 'Reset demo rows to default order.');
  }

  dismissToast(id: string): void {
    this.toasts.update((items) => items.filter((toast) => toast.id !== id));
  }

  private compareRows(a: DemoUserRow, b: DemoUserRow, key: DemoUserSortableKey): number {
    const left = a[key];
    const right = b[key];

    if (left instanceof Date && right instanceof Date) {
      return left.getTime() - right.getTime();
    }
    if (typeof left === 'number' && typeof right === 'number') {
      return left - right;
    }
    return String(left).localeCompare(String(right));
  }

  private isSortableKey(key: string): key is DemoUserSortableKey {
    return key === 'name' || key === 'email' || key === 'lastLogin' || key === 'salary';
  }

  private buildInitialRows(): DemoUserRow[] {
    return [
      {
        id: 1,
        name: 'Alice Johnson',
        email: 'alice@example.com',
        role: 'Admin',
        status: 'Active',
        lastLogin: new Date('2026-02-22T08:30:00Z'),
        salary: 85000
      },
      {
        id: 2,
        name: 'Bob Smith',
        email: 'bob@example.com',
        role: 'User',
        status: 'Inactive',
        lastLogin: new Date('2026-02-12T13:00:00Z'),
        salary: 65000
      },
      {
        id: 3,
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        role: 'User',
        status: 'Active',
        lastLogin: new Date('2026-02-18T11:45:00Z'),
        salary: 72000
      },
      {
        id: 4,
        name: 'Diana Prince',
        email: 'diana@example.com',
        role: 'Manager',
        status: 'Active',
        lastLogin: new Date('2026-02-21T09:10:00Z'),
        salary: 95000
      },
      {
        id: 5,
        name: 'Evan Wright',
        email: 'evan@example.com',
        role: 'User',
        status: 'Active',
        lastLogin: new Date('2026-02-19T16:05:00Z'),
        salary: 68000
      }
    ];
  }

  private pushToast(type: ToastMessage['type'], message: string): void {
    const id = `table-toast-${Date.now()}-${this.toasts().length}`;
    this.toasts.update((items) => [...items, { id, type, message }]);
  }
}
