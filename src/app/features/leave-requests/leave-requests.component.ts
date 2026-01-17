import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiDataTableComponent, TableColumn } from '../../shared/components/ui-data-table/ui-data-table.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiModalComponent } from '../../shared/components/ui-modal/ui-modal.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../shared/services/form-helper.service';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { api } from '../../../../convex/_generated/api';

@Component({
  selector: 'app-leave-requests',
  standalone: true,
  imports: [CommonModule, UiDataTableComponent, UiButtonComponent, UiModalComponent, UiIconComponent, DynamicFormComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="heading-accent">Leave Requests</h1>
          <p class="mt-3 text-stone-500">Manage employee leave applications.</p>
        </div>
        <ui-button (onClick)="openCreateModal()">
          <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
          New Request
        </ui-button>
      </div>

      <ui-data-table
          [data]="requests()"
          [columns]="columns"
          [loading]="loading()"
          [actionsTemplate]="actionsRef"
        ></ui-data-table>

      <ng-template #actionsRef let-row>
        <div class="flex gap-2 justify-end">
          @if (row.status === 'pending' && canManage()) {
            <button
              class="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              (click)="updateStatus(row, 'approved')"
              title="Approve"
            >
              <ui-icon name="check" class="w-4 h-4"></ui-icon>
            </button>
            <button
              class="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              (click)="updateStatus(row, 'rejected')"
              title="Reject"
            >
              <ui-icon name="x-mark" class="w-4 h-4"></ui-icon>
            </button>
          }
          @if (row.status === 'pending' && isOwnRequest(row)) {
            <button
              class="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              (click)="updateStatus(row, 'cancelled')"
              title="Cancel Request"
            >
              <ui-icon name="trash" class="w-4 h-4"></ui-icon>
            </button>
          }
        </div>
      </ng-template>

      <ui-modal
        [(isOpen)]="showModal"
        title="New Leave Request"
      >
        <app-dynamic-form
          [fields]="formConfig()"
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
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  currentUser = computed(() => this.authService.getUser()());
  canManage = this.authService.hasRole(['super_admin', 'admin', 'hr_manager', 'manager']);

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

  baseFormConfig: FieldConfig[] = [
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

  formConfig = computed(() => {
    // If user is manager/admin, show employee selection
    // If user is regular employee, hide employee selection (or make it read-only/defaulted)
    // For simplicity, we'll keep the dropdown for admins, but for regular users we might want to auto-fill.
    // However, DynamicForm might not support hidden fields easily.
    // Let's filter the config based on role.

    if (this.canManage()) {
      return this.baseFormConfig;
    } else {
      // For regular employees, remove the employeeId field from the form
      // We will inject it during submission
      return this.baseFormConfig.filter(f => f.name !== 'employeeId');
    }
  });

  ngOnInit() {
    const client = this.convexService.getClient();

    // Subscribe to requests
    this.unsubscribe = client.onUpdate(api.leave_requests.list, {}, (data) => {
      this.requests.set(data);
      this.loading.set(false);
    });

    // Fetch employees for the dropdown
    // Only fetch if we can manage, otherwise we don't need the list
    if (this.canManage()) {
       this.employeesUnsubscribe = client.onUpdate(api.employees.list, {}, (data) => {
        this.employees.set(data);
        this.updateEmployeeOptions(data);
      });
    }
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

    // Update base config
    this.baseFormConfig = this.baseFormConfig.map(field => {
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
      let employeeId = formData.employeeId;

      // If not managing (regular employee), use own ID
      if (!this.canManage()) {
        const user = this.authService.getUser()();
        if (user && user.employeeId) {
          employeeId = user.employeeId;
        } else {
          throw new Error('Employee profile not found');
        }
      }

      await client.mutation(api.leave_requests.create, {
        employeeId: employeeId,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason
      });
      this.showModal.set(false);
      this.toastService.success('Leave request submitted successfully');
    } catch (error: any) {
      console.error('Error creating leave request:', error);
      this.toastService.error(error.message || 'Failed to submit leave request');
    } finally {
      this.submitting.set(false);
    }
  }

  isOwnRequest(row: any): boolean {
    const user = this.currentUser();
    return user?.employeeId === row.employeeId;
  }

  async updateStatus(row: any, status: 'approved' | 'rejected' | 'cancelled') {
    const action = status === 'cancelled' ? 'cancel' : status;
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;

    try {
      const client = this.convexService.getClient();
      await client.mutation(api.leave_requests.updateStatus, {
        id: row._id,
        status
      });
      this.toastService.success(`Leave request ${status} successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      this.toastService.error(`Failed to ${status} request. Please try again.`);
    }
  }
}
