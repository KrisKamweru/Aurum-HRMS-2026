import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiDataTableComponent, TableColumn } from '../../shared/components/ui-data-table/ui-data-table.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiModalComponent } from '../../shared/components/ui-modal/ui-modal.component';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../shared/services/form-helper.service';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { api } from '../../../../convex/_generated/api';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, UiDataTableComponent, UiButtonComponent, UiModalComponent, DynamicFormComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold text-stone-900">Employees</h2>
          <p class="mt-1 text-stone-500">Manage your workforce.</p>
        </div>
        <ui-button (onClick)="openCreateModal()">
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </ui-button>
      </div>

      <div class="bg-white rounded-2xl shadow-lg shadow-stone-200/50 border border-stone-200 overflow-hidden">
        <ui-data-table
          [data]="employees()"
          [columns]="columns"
          [loading]="loading()"
          [actionsTemplate]="actionsRef"
        ></ui-data-table>
      </div>

      <ng-template #actionsRef let-row>
        <div class="flex gap-2 justify-end">
          <button
            class="p-1.5 text-stone-400 hover:text-[#8b1e3f] hover:bg-[#fdf2f4] rounded-lg transition-colors"
            (click)="openEditModal(row)"
            title="Edit"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            class="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            (click)="deleteEmployee(row)"
            title="Delete"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </ng-template>

      <ui-modal
        [(isOpen)]="showModal"
        [title]="isEditing() ? 'Edit Employee' : 'Add Employee'"
      >
        <app-dynamic-form
          [fields]="formConfig"
          [initialValues]="currentEmployee() || {}"
          [loading]="submitting()"
          [submitLabel]="isEditing() ? 'Update' : 'Create'"
          (formSubmit)="onSubmit($event)"
          (cancel)="showModal.set(false)"
          [showCancel]="true"
        ></app-dynamic-form>
      </ui-modal>
    </div>
  `
})
export class EmployeesComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);

  employees = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);

  showModal = signal(false);
  isEditing = signal(false);
  currentEmployee = signal<any>(null);

  private unsubscribe: (() => void) | null = null;

  columns: TableColumn[] = [
    { key: 'firstName', header: 'First Name', sortable: true },
    { key: 'lastName', header: 'Last Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'position', header: 'Position', sortable: true },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      badgeVariant: (value) => {
        switch (value) {
          case 'active': return 'success';
          case 'on-leave': return 'warning';
          case 'terminated': return 'danger';
          default: return 'neutral';
        }
      }
    }
  ];

  formConfig: FieldConfig[] = [
    { name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'e.g. John' },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'e.g. Doe' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'e.g. john.doe@company.com' },
    { name: 'department', label: 'Department', type: 'text', required: true, placeholder: 'e.g. Engineering' },
    { name: 'position', label: 'Position', type: 'text', required: true, placeholder: 'e.g. Software Engineer' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'On Leave', value: 'on-leave' },
        { label: 'Terminated', value: 'terminated' }
      ]
    },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true }
  ];

  ngOnInit() {
    const client = this.convexService.getClient();
    this.unsubscribe = client.onUpdate(api.employees.list, {}, (data) => {
      this.employees.set(data);
      this.loading.set(false);
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.currentEmployee.set({ status: 'active', startDate: new Date().toISOString().split('T')[0] });
    this.showModal.set(true);
  }

  openEditModal(row: any) {
    this.isEditing.set(true);
    this.currentEmployee.set(row);
    this.showModal.set(true);
  }

  async onSubmit(formData: any) {
    this.submitting.set(true);
    const client = this.convexService.getClient();

    try {
      if (this.isEditing()) {
        const id = this.currentEmployee()._id;
        await client.mutation(api.employees.update, {
          id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          department: formData.department,
          position: formData.position
        });

        // Update status separately if needed, or update mutation to handle it
        if (formData.status !== this.currentEmployee().status) {
          await client.mutation(api.employees.updateStatus, {
            id,
            status: formData.status
          });
        }
      } else {
        await client.mutation(api.employees.create, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          department: formData.department,
          position: formData.position,
          status: formData.status,
          startDate: formData.startDate
        });
      }
      this.showModal.set(false);
    } catch (error) {
      console.error('Error saving employee:', error);
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteEmployee(row: any) {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const client = this.convexService.getClient();
      await client.mutation(api.employees.remove, { id: row._id });
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  }
}
