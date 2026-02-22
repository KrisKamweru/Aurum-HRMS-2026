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
    <ui-toast [toasts]="toasts()" (dismiss)="dismissToast($event)"></ui-toast>

    <div class="space-y-6">
      <header class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy-700 dark:text-burgundy-400">Demo</p>
        <h2 class="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">Data Tables</h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          Config-driven table rendering using the rebuilt ui-data-table component.
        </p>
      </header>

      <ui-card variant="glass" title="User Directory Table" subtitle="Sorting + row interaction + semantic badge columns">
        <div class="space-y-4">
          <div class="flex flex-wrap gap-3">
            <ui-button variant="secondary" size="sm" (onClick)="toggleLoading()">
              {{ loading() ? 'Disable Loading' : 'Show Loading State' }}
            </ui-button>
            <ui-button variant="outline" size="sm" (onClick)="resetRows()">Reset Rows</ui-button>
            @if (selectedRowName()) {
              <span class="inline-flex items-center rounded-full bg-burgundy-50 px-3 py-1 text-xs font-semibold text-burgundy-700 dark:bg-burgundy-700/20 dark:text-burgundy-300">
                Selected: {{ selectedRowName() }}
              </span>
            }
          </div>

          <ui-data-table
            [data]="rows()"
            [columns]="columns"
            [loading]="loading()"
            headerVariant="neutral"
            (sortChange)="onSort($event)"
            (rowClick)="onRowClick($event)"
          />
        </div>
      </ui-card>
    </div>
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
