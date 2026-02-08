import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UiDataTableComponent, TableColumn } from '../../shared/components/ui-data-table/ui-data-table.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiModalComponent } from '../../shared/components/ui-modal/ui-modal.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form.component';
import { UiGridComponent } from '../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../shared/components/ui-grid/ui-grid-tile.component';
import { FieldConfig } from '../../shared/services/form-helper.service';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { api } from '../../../../convex/_generated/api';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, UiDataTableComponent, UiButtonComponent, UiModalComponent, UiIconComponent, DynamicFormComponent, UiGridComponent, UiGridTileComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">Employees</h1>
          <p class="mt-3 text-[15px] text-stone-500 dark:text-stone-400">Manage your workforce.</p>
        </div>
        @if (canManage()) {
          <ui-button
            (onClick)="openCreateModal()"
            [prerequisitesMet]="departments().length > 0 && designations().length > 0"
            prerequisiteMessage="You need to create Departments and Designations before adding employees."
            [prerequisiteAction]="{ label: 'Go to Organization', link: ['/organization'] }"
          >
            <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
            Add Employee
          </ui-button>
        }
      </div>

      <!-- Dash-frame glass container -->
      <div class="dash-frame">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="Employees" variant="compact">
            <div class="tile-body">
              <ui-data-table
                [data]="employees()"
                [columns]="columns"
                [loading]="loading()"
                [actionsTemplate]="actionsRef"
                headerVariant="neutral"
              ></ui-data-table>
            </div>
          </ui-grid-tile>
        </ui-grid>
      </div>

      <ng-template #actionsRef let-row>
        <div class="flex gap-2 justify-end">
          <button
            class="p-1.5 text-stone-400 hover:text-burgundy-700 hover:bg-burgundy-50 dark:hover:text-burgundy-300 dark:hover:bg-burgundy-700/20 rounded-lg transition-colors"
            (click)="viewEmployee(row)"
            title="View Details"
          >
            <ui-icon name="eye" class="w-4 h-4"></ui-icon>
          </button>

          @if (canManage()) {
            <button
              class="p-1.5 text-stone-400 hover:text-burgundy-700 hover:bg-burgundy-50 dark:hover:text-burgundy-300 dark:hover:bg-burgundy-700/20 rounded-lg transition-colors"
              (click)="openEditModal(row)"
              title="Edit"
            >
              <ui-icon name="pencil" class="w-4 h-4"></ui-icon>
            </button>
            <button
              class="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              (click)="deleteEmployee(row)"
              title="Delete"
            >
              <ui-icon name="trash" class="w-4 h-4"></ui-icon>
            </button>
          }
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
  private toastService = inject(ToastService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);

  canManage = this.authService.hasRole(['super_admin', 'admin', 'hr_manager', 'manager']);

  employees = signal<any[]>([]);
  departments = signal<any[]>([]);
  designations = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);

  showModal = signal(false);
  isEditing = signal(false);
  currentEmployee = signal<any>(null);

  private unsubscribe: (() => void) | null = null;
  private departmentsUnsubscribe: (() => void) | null = null;
  private designationsUnsubscribe: (() => void) | null = null;
  private locationsUnsubscribe: (() => void) | null = null;

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
    {
      name: 'departmentId',
      label: 'Department',
      type: 'select',
      required: true,
      options: []
    },
    {
      name: 'designationId',
      label: 'Position/Designation',
      type: 'select',
      required: true,
      options: []
    },
    {
      name: 'locationId',
      label: 'Location',
      type: 'select',
      required: false,
      options: []
    },
    {
      name: 'managerId',
      label: 'Reports To',
      type: 'select',
      required: false,
      options: []
    },
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
    { name: 'phone', label: 'Phone', type: 'text', required: false, placeholder: 'e.g. +1 555-1234' },
    { name: 'address', label: 'Address', type: 'textarea', required: false, placeholder: 'Full address' },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      required: false,
      options: [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Other', value: 'Other' },
        { label: 'Prefer not to say', value: 'Prefer not to say' }
      ]
    },
    { name: 'dob', label: 'Date of Birth', type: 'date', required: false },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true }
  ];

  ngOnInit() {
    const client = this.convexService.getClient();

    // Subscribe to employees
    this.unsubscribe = client.onUpdate(api.employees.list, {}, (data) => {
      this.employees.set(data);
      this.loading.set(false);
      // Update manager options whenever employees list changes
      // If we are not currently editing, we can update globally
      if (!this.isEditing()) {
        this.updateManagerOptions(data);
      }
    });

    // Subscribe to Departments
    this.departmentsUnsubscribe = client.onUpdate(api.organization.listDepartments, {}, (data) => {
      this.departments.set(data);
      this.updateDepartmentOptions(data);
    });

    // Subscribe to Designations
    this.designationsUnsubscribe = client.onUpdate(api.organization.listDesignations, {}, (data) => {
      this.designations.set(data);
      this.updateDesignationOptions(data);
    });

    // Subscribe to Locations
    this.locationsUnsubscribe = client.onUpdate(api.organization.listLocations, {}, (data) => {
      this.updateLocationOptions(data);
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.departmentsUnsubscribe) this.departmentsUnsubscribe();
    if (this.designationsUnsubscribe) this.designationsUnsubscribe();
    if (this.locationsUnsubscribe) this.locationsUnsubscribe();
  }

  updateDepartmentOptions(departments: any[]) {
    const options = departments.map(d => ({ label: d.name, value: d._id }));
    this.formConfig = this.formConfig.map(field => {
      if (field.name === 'departmentId') return { ...field, options };
      return field;
    });
  }

  updateDesignationOptions(designations: any[]) {
    const options = designations.map(d => ({ label: d.title, value: d._id }));
    this.formConfig = this.formConfig.map(field => {
      if (field.name === 'designationId') return { ...field, options };
      return field;
    });
  }

  updateLocationOptions(locations: any[]) {
    const options = locations.map(l => ({ label: l.name, value: l._id }));
    this.formConfig = this.formConfig.map(field => {
      if (field.name === 'locationId') return { ...field, options };
      return field;
    });
  }

  updateManagerOptions(employees: any[]) {
    const options = employees.map(e => ({
      label: `${e.firstName} ${e.lastName}`,
      value: e._id
    }));
    this.formConfig = this.formConfig.map(field => {
      if (field.name === 'managerId') return { ...field, options };
      return field;
    });
  }

  openCreateModal() {
    // Prerequisites handled by ui-button prerequisitesMet
    this.isEditing.set(false);
    this.currentEmployee.set({ status: 'active', startDate: new Date().toISOString().split('T')[0] });

    // Ensure manager options include everyone
    this.updateManagerOptions(this.employees());

    this.showModal.set(true);
  }

  viewEmployee(row: any) {
    this.router.navigate(['/employees', row._id]);
  }

  openEditModal(row: any) {
    this.isEditing.set(true);
    // Map flattened row data back to IDs if needed, or rely on the fact that row usually contains the raw doc + enriched fields
    // The list query returns enriched data. We need to make sure we have the IDs.
    // The current list implementation returns: ...emp (which has departmentId, designationId), department (name), position (name)
    // So the IDs should be present in 'row'.
    this.currentEmployee.set(row);

    // Filter out self from manager options to avoid circular reporting
    const allEmployees = this.employees();
    const otherEmployees = allEmployees.filter(e => e._id !== row._id);
    this.updateManagerOptions(otherEmployees);

    this.showModal.set(true);
  }

  async onSubmit(formData: any) {
    this.submitting.set(true);
    const client = this.convexService.getClient();

    try {
      const commonData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        departmentId: formData.departmentId,
        designationId: formData.designationId,
        locationId: formData.locationId || undefined,
        managerId: formData.managerId || undefined,
        startDate: formData.startDate,
        phone: formData.phone,
        address: formData.address,
        gender: formData.gender,
        dob: formData.dob
      };

      if (this.isEditing()) {
        const id = this.currentEmployee()._id;
        await client.mutation(api.employees.update, {
          id,
          ...commonData
        });

        if (formData.status !== this.currentEmployee().status) {
          await client.mutation(api.employees.updateStatus, {
            id,
            status: formData.status
          });
        }
      } else {
        await client.mutation(api.employees.create, {
          ...commonData,
          status: formData.status,
        });
      }
      this.showModal.set(false);
      this.toastService.success(this.isEditing() ? 'Employee updated successfully' : 'Employee created successfully');
    } catch (error) {
      console.error('Error saving employee:', error);
      this.toastService.error('Failed to save employee. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteEmployee(row: any) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Employee',
      message: 'Are you sure you want to delete this employee? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      const client = this.convexService.getClient();
      await client.mutation(api.employees.remove, { id: row._id });
      this.toastService.success('Employee deleted successfully');
    } catch (error) {
      console.error('Error deleting employee:', error);
      this.toastService.error('Failed to delete employee. Please try again.');
    }
  }
}
