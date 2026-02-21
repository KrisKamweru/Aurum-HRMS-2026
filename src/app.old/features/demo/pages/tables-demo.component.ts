import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiDataTableComponent, TableColumn, SortEvent } from '../../../shared/components/ui-data-table/ui-data-table.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-tables-demo',
  standalone: true,
  imports: [CommonModule, UiDataTableComponent, UiButtonComponent],
  template: `
    <div class="space-y-8">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Data Table</h2>
        <p class="text-gray-600 mb-4">Config-driven table with sorting, pagination, and custom column types.</p>

        <ui-data-table
          [data]="users()"
          [columns]="columns"
          [totalItems]="100"
          [pageSize]="10"
          [page]="1"
          [pagination]="true"
          [loading]="loading()"
          [actionsTemplate]="actionsRef"
          (sortChange)="onSort($event)"
          (pageChange)="onPage($event)"
          (rowClick)="onRowClick($event)"
        ></ui-data-table>

        <ng-template #actionsRef let-row>
          <div class="flex gap-2 justify-end">
            <ui-button variant="ghost" size="sm" (onClick)="onEdit(row); $event.stopPropagation()">Edit</ui-button>
            <ui-button variant="ghost" size="sm" class="text-red-600 hover:text-red-700 hover:bg-red-50" (onClick)="onDelete(row); $event.stopPropagation()">Delete</ui-button>
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class TablesDemoComponent {
  private toastService = inject(ToastService);
  loading = signal(false);

  columns: TableColumn[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Role', type: 'badge', badgeVariant: (val) => val === 'Admin' ? 'primary' : 'neutral' },
    { key: 'status', header: 'Status', type: 'badge', badgeVariant: (val) => val === 'Active' ? 'success' : 'danger' },
    { key: 'lastLogin', header: 'Last Login', type: 'date', sortable: true },
    { key: 'salary', header: 'Salary', type: 'currency' }
  ];

  // Mock Data
  users = signal([
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active', lastLogin: new Date(), salary: 85000 },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User', status: 'Inactive', lastLogin: new Date('2023-12-01'), salary: 65000 },
    { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'User', status: 'Active', lastLogin: new Date('2024-01-10'), salary: 72000 },
    { id: 4, name: 'Diana Prince', email: 'diana@example.com', role: 'Manager', status: 'Active', lastLogin: new Date(), salary: 95000 },
    { id: 5, name: 'Evan Wright', email: 'evan@example.com', role: 'User', status: 'Active', lastLogin: new Date('2024-01-05'), salary: 68000 },
  ]);

  onSort(event: SortEvent) {
    // In a real app, this would trigger a data fetch or local sort
    const direction = event.direction === 'asc' ? 1 : -1;
    this.users.update(users => [...users].sort((a: any, b: any) => {
      return a[event.key] > b[event.key] ? direction : -direction;
    }));
    this.toastService.info(`Sorted by ${event.key} ${event.direction}`);
  }

  onPage(page: number) {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.toastService.info(`Loaded page ${page}`);
    }, 500); // Simulate fetch
  }

  onRowClick(row: any) {
    this.toastService.info(`Clicked row: ${row.name}`);
  }

  onEdit(row: any) {
    this.toastService.success(`Editing ${row.name}`);
  }

  onDelete(row: any) {
    this.toastService.error(`Deleted ${row.name}`);
  }
}
