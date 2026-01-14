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
  selector: 'app-leave-requests',
  standalone: true,
  imports: [CommonModule, UiDataTableComponent, UiButtonComponent, UiModalComponent, DynamicFormComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold text-stone-900">Leave Requests</h2>
          <p class="mt-1 text-stone-500">Manage employee leave applications.</p>
        </div>
        <ui-button (onClick)="openCreateModal()">
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Request
        </ui-button>
      </div>

      <div class="bg-white rounded-2xl shadow-lg shadow-stone-200/50 border border-stone-200 overflow-hidden">
        <ui-data-table
          [data]="requests()"
          [columns]="columns"
          [loading]="loading()"
          [actionsTemplate]="actionsRef"
        ></ui-data-table>
      </div>

      <ng-template #actionsRef let-row>
        @if (row.status === 'pending') {
          <div class="flex gap-2 justify-end">
            <button
              class="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              (click)="updateStatus(row, 'approved')"
              title="Approve"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              class="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              (click)="updateStatus(row, 'rejected')"
              title="Reject"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        }
      </ng-template>

      <ui-modal
        [(isOpen)]="showModal"
        title="New Leave Request"
      >
        <app-dynamic-form
          [fields]="formConfig"
          [initialValues]="{}"
          [loading]="submitting()"
          submitLabel="Submit Request"
          (formSubmit)="onSubmit($event)"
          (cancel)="showModal.set(false)"
          [showCancel]="true"
        ></app-dynamic-form>
      </ui-modal>
    </div>
  `
})
export class LeaveRequestsComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);

  requests = signal<any[]>([]);
  employees = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);

  private unsubscribe: (() => void) | null = null;
  private employeesUnsubscribe: (() => void) | null = null;

  columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'type', header: 'Type', sortable: true },
    {
      key: 'startDate',
      header: 'Start Date',
      type: 'date',
      sortable: true
    },
    {
      key: 'endDate',
      header: 'End Date',
      type: 'date',
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      badgeVariant: (value) => {
        switch (value) {
          case 'approved': return 'success';
          case 'pending': return 'warning';
          case 'rejected': return 'danger';
          default: return 'neutral';
        }
      }
    }
  ];

  formConfig: FieldConfig[] = [
    {
      name: 'employeeId',
      label: 'Employee',
      type: 'select',
      required: true,
      options: [] // Will be populated dynamically
    },
    {
      name: 'type',
      label: 'Leave Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Vacation', value: 'vacation' },
        { label: 'Sick Leave', value: 'sick' },
        { label: 'Personal', value: 'personal' }
      ]
    },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true },
    { name: 'endDate', label: 'End Date', type: 'date', required: true },
    { name: 'reason', label: 'Reason', type: 'textarea', placeholder: 'Optional reason' }
  ];

  ngOnInit() {
    const client = this.convexService.getClient();

    // Subscribe to requests
    this.unsubscribe = client.onUpdate(api.leave_requests.list, {}, (data) => {
      this.requests.set(data);
      this.loading.set(false);
    });

    // Fetch employees for the dropdown
    this.employeesUnsubscribe = client.onUpdate(api.employees.list, {}, (data) => {
      this.employees.set(data);
      this.updateEmployeeOptions(data);
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.employeesUnsubscribe) this.employeesUnsubscribe();
  }

  updateEmployeeOptions(employees: any[]) {
    const employeeOptions = employees.map(emp => ({
      label: `${emp.firstName} ${emp.lastName}`,
      value: emp._id
    }));

    // Update form config with new options
    this.formConfig = this.formConfig.map(field => {
      if (field.name === 'employeeId') {
        return { ...field, options: employeeOptions };
      }
      return field;
    });
  }

  openCreateModal() {
    this.showModal.set(true);
  }

  async onSubmit(formData: any) {
    this.submitting.set(true);
    const client = this.convexService.getClient();

    try {
      await client.mutation(api.leave_requests.create, {
        employeeId: formData.employeeId,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason
      });
      this.showModal.set(false);
    } catch (error) {
      console.error('Error creating leave request:', error);
    } finally {
      this.submitting.set(false);
    }
  }

  async updateStatus(row: any, status: 'approved' | 'rejected') {
    if (!confirm(`Are you sure you want to ${status} this request?`)) return;

    try {
      const client = this.convexService.getClient();
      await client.mutation(api.leave_requests.updateStatus, {
        id: row._id,
        status
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }
}
