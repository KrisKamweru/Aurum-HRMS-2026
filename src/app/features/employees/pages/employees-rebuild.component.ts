import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { RebuildEmployeeRecord } from '../data/employees-rebuild.models';
import { EmployeesRebuildStore } from '../data/employees-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-employees-rebuild',
  imports: [DatePipe, UiBadgeComponent, UiButtonComponent, UiModalComponent, DynamicFormComponent, UiConfirmDialogComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Employees</h1>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Workforce directory baseline for the rebuild. Manage core profile records and route into detail surfaces.
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <ui-badge variant="primary" size="sm" [rounded]="true">Active {{ activeEmployeeCount() }}</ui-badge>
            <ui-badge variant="neutral" size="sm" [rounded]="true">Inactive {{ inactiveEmployeeCount() }}</ui-badge>
            <ui-badge variant="neutral" size="sm" [rounded]="true">Total {{ employees().length }}</ui-badge>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <ui-button variant="secondary" size="sm" [disabled]="listLoading()" (onClick)="refresh()">Refresh</ui-button>
          <ui-button variant="primary" size="sm" [disabled]="!canCreateEmployee() || isSaving()" (onClick)="openCreateModal()">
            Add Employee
          </ui-button>
        </div>
      </section>

      @if (!canCreateEmployee()) {
        <section class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700/30 dark:bg-amber-900/20 dark:text-amber-300">
          Create at least one department and one designation before adding employees.
        </section>
      }

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" [disabled]="listLoading()" (onClick)="refresh()">Retry</ui-button>
        </section>
      }

      @if (listLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-4 w-36 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-28 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else if (employees().length === 0) {
        <section class="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <p class="text-lg font-semibold text-stone-800 dark:text-stone-100">No employees found</p>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">Add your first employee profile to begin.</p>
          <div class="mt-4 flex justify-center gap-2">
            <ui-button variant="secondary" size="sm" (onClick)="refresh()">Refresh</ui-button>
            <ui-button variant="primary" size="sm" [disabled]="!canCreateEmployee()" (onClick)="openCreateModal()">
              Add Employee
            </ui-button>
          </div>
        </section>
      } @else {
        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-white/8">
            <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Directory</p>
            <p class="text-xs text-stone-500 dark:text-stone-400">
              Last refreshed
              @if (lastRefreshedAt()) {
                {{ lastRefreshedAt() | date: 'MMM d, y, h:mm a' }}
              } @else {
                just now
              }
            </p>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-[#eeedf0] text-xs font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.02] dark:text-stone-400">
                <tr>
                  <th class="px-4 py-3">Employee</th>
                  <th class="px-4 py-3">Department</th>
                  <th class="px-4 py-3">Designation</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3">Start Date</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (employee of employees(); track employee.id) {
                  <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                    <td class="px-4 py-3">
                      <p class="font-semibold text-stone-800 dark:text-stone-100">{{ employee.fullName }}</p>
                      <p class="text-xs text-stone-500 dark:text-stone-400">{{ employee.email }}</p>
                    </td>
                    <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ employee.department || 'Unassigned' }}</td>
                    <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ employee.position || 'Unassigned' }}</td>
                    <td class="px-4 py-3">
                      <ui-badge size="sm" [rounded]="true" [variant]="statusVariant(employee.status)">
                        {{ employee.status }}
                      </ui-badge>
                    </td>
                    <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ employee.startDate || 'n/a' }}</td>
                    <td class="px-4 py-3">
                      <div class="flex justify-end gap-2">
                        <ui-button variant="outline" size="sm" (onClick)="viewEmployee(employee.id)">View</ui-button>
                        <ui-button variant="secondary" size="sm" [disabled]="isSaving()" (onClick)="openEditModal(employee)">Edit</ui-button>
                        <ui-button variant="danger" size="sm" [disabled]="isSaving()" (onClick)="requestEmployeeRemoval(employee.id)">Delete</ui-button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      <ui-modal
        [isOpen]="isCreateModalOpen()"
        (isOpenChange)="isCreateModalOpen.set($event)"
        [canDismiss]="true"
        [hasFooter]="false"
        width="normal"
        title="Create Employee"
      >
        <app-dynamic-form
          container="modal"
          [fields]="employeeFields"
          [sections]="employeeSections"
          [steps]="employeeSteps"
          [initialValues]="createInitialValues()"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Create Employee"
          (cancel)="closeCreateModal()"
          (formSubmit)="createEmployeeFromForm($event)"
        />
      </ui-modal>

      <ui-modal
        [isOpen]="isEditModalOpen()"
        (isOpenChange)="isEditModalOpen.set($event)"
        [canDismiss]="true"
        [hasFooter]="false"
        width="normal"
        title="Edit Employee"
      >
        <app-dynamic-form
          container="modal"
          [fields]="employeeFields"
          [sections]="employeeSections"
          [steps]="employeeSteps"
          [initialValues]="editInitialValues()"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Save Changes"
          (cancel)="closeEditModal()"
          (formSubmit)="updateEmployeeFromForm($event)"
        />
      </ui-modal>

      <ui-confirm-dialog
        [isOpen]="isDeleteDialogOpen()"
        (isOpenChange)="isDeleteDialogOpen.set($event)"
        [options]="deleteDialogOptions"
        (confirm)="confirmEmployeeRemoval()"
      />
    </main>
  `
})
export class EmployeesRebuildComponent implements OnInit {
  private readonly store = inject(EmployeesRebuildStore);
  private readonly router = inject(Router);

  readonly employees = this.store.employees;
  readonly listLoading = this.store.listLoading;
  readonly isSaving = this.store.isSaving;
  readonly error = this.store.error;
  readonly activeEmployeeCount = this.store.activeEmployeeCount;
  readonly inactiveEmployeeCount = this.store.inactiveEmployeeCount;
  readonly departmentReferences = this.store.departmentReferences;
  readonly designationReferences = this.store.designationReferences;
  readonly locationReferences = this.store.locationReferences;
  readonly managerReferences = this.store.managerReferences;

  readonly lastRefreshedAt = signal<Date | null>(null);
  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly isDeleteDialogOpen = signal(false);
  readonly createInitialValues = signal<Record<string, unknown>>({});
  readonly editInitialValues = signal<Record<string, unknown>>({});
  readonly editingEmployeeId = signal<string | null>(null);
  readonly pendingDeleteEmployeeId = signal<string | null>(null);

  readonly deleteDialogOptions: ConfirmDialogOptions = {
    title: 'Delete Employee',
    message: 'This action permanently removes the employee record.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger'
  };

  readonly employeeSections: FormSectionConfig[] = [
    {
      id: 'identity',
      title: 'Identity',
      description: 'Core profile details',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'organization',
      title: 'Organization',
      description: 'Reporting and assignment metadata',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'personal',
      title: 'Optional personal data',
      description: 'Secondary profile data',
      columns: { base: 1, md: 2, lg: 2 }
    }
  ];

  readonly employeeSteps: FormStepConfig[] = [
    { id: 'employee-step-1', title: 'Identity', sectionIds: ['identity'] },
    { id: 'employee-step-2', title: 'Organization', sectionIds: ['organization'] },
    { id: 'employee-step-3', title: 'Personal', sectionIds: ['personal'] }
  ];

  get employeeFields(): FieldConfig[] {
    return [
      {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        sectionId: 'identity',
        required: true
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        sectionId: 'identity',
        required: true
      },
      {
        name: 'email',
        label: 'Work Email',
        type: 'email',
        sectionId: 'identity',
        required: true,
        colSpan: 2
      },
      {
        name: 'startDate',
        label: 'Start Date',
        type: 'date',
        sectionId: 'identity',
        required: true
      },
      {
        name: 'status',
        label: 'Employment Status',
        type: 'select',
        sectionId: 'identity',
        required: true,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'On Leave', value: 'on-leave' },
          { label: 'Resigned', value: 'resigned' },
          { label: 'Terminated', value: 'terminated' }
        ]
      },
      {
        name: 'departmentId',
        label: 'Department',
        type: 'select',
        sectionId: 'organization',
        required: true,
        options: this.departmentReferences().map((department) => ({
          label: department.label,
          value: department.id
        }))
      },
      {
        name: 'designationId',
        label: 'Designation',
        type: 'select',
        sectionId: 'organization',
        required: true,
        options: this.designationReferences().map((designation) => ({
          label: designation.label,
          value: designation.id
        }))
      },
      {
        name: 'locationId',
        label: 'Location',
        type: 'select',
        sectionId: 'organization',
        required: false,
        options: this.locationReferences().map((location) => ({
          label: location.meta ? `${location.label} (${location.meta})` : location.label,
          value: location.id
        }))
      },
      {
        name: 'managerId',
        label: 'Manager',
        type: 'select',
        sectionId: 'organization',
        required: false,
        options: this.managerReferences().map((manager) => ({
          label: manager.meta ? `${manager.label} (${manager.meta})` : manager.label,
          value: manager.id
        }))
      },
      {
        name: 'phone',
        label: 'Phone',
        type: 'text',
        sectionId: 'personal',
        required: false
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        sectionId: 'personal',
        required: false,
        options: [
          { label: 'Female', value: 'Female' },
          { label: 'Male', value: 'Male' },
          { label: 'Other', value: 'Other' },
          { label: 'Prefer not to say', value: 'Prefer not to say' }
        ]
      },
      {
        name: 'dob',
        label: 'Date of Birth',
        type: 'date',
        sectionId: 'personal',
        required: false
      },
      {
        name: 'address',
        label: 'Address',
        type: 'textarea',
        sectionId: 'personal',
        required: false,
        colSpan: 2
      }
    ];
  }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.lastRefreshedAt.set(new Date());
    void Promise.all([this.store.loadEmployees(), this.store.loadReferences()]);
  }

  canCreateEmployee(): boolean {
    return this.departmentReferences().length > 0 && this.designationReferences().length > 0;
  }

  openCreateModal(): void {
    this.createInitialValues.set({
      status: 'active',
      startDate: this.todayIso()
    });
    this.isCreateModalOpen.set(true);
    this.store.clearError();
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  openEditModal(employee: RebuildEmployeeRecord): void {
    this.editingEmployeeId.set(employee.id);
    this.editInitialValues.set({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      departmentId: employee.departmentId ?? '',
      designationId: employee.designationId ?? '',
      locationId: employee.locationId ?? '',
      managerId: employee.managerId ?? '',
      status: employee.status,
      startDate: employee.startDate,
      phone: employee.phone ?? '',
      address: employee.address ?? '',
      gender: employee.gender ?? '',
      dob: employee.dob ?? ''
    });
    this.isEditModalOpen.set(true);
    this.store.clearError();
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingEmployeeId.set(null);
  }

  viewEmployee(id: string): void {
    void this.router.navigate(['/employees', id]);
  }

  async createEmployeeFromForm(payload: Record<string, unknown>): Promise<void> {
    const success = await this.store.addEmployee(this.readEmployeeDraft(payload));
    if (success) {
      this.closeCreateModal();
    }
  }

  async updateEmployeeFromForm(payload: Record<string, unknown>): Promise<void> {
    const id = this.editingEmployeeId();
    if (!id) {
      return;
    }
    const success = await this.store.updateEmployee({
      id,
      ...this.readEmployeeDraft(payload)
    });
    if (success) {
      this.closeEditModal();
    }
  }

  requestEmployeeRemoval(id: string): void {
    this.pendingDeleteEmployeeId.set(id);
    this.isDeleteDialogOpen.set(true);
    this.store.clearError();
  }

  async confirmEmployeeRemoval(): Promise<void> {
    const id = this.pendingDeleteEmployeeId();
    if (!id) {
      return;
    }
    const success = await this.store.removeEmployee(id);
    if (success) {
      this.pendingDeleteEmployeeId.set(null);
      this.isDeleteDialogOpen.set(false);
    }
  }

  statusVariant(status: string): BadgeVariant {
    const normalized = status.trim().toLowerCase();
    if (normalized === 'active') {
      return 'success';
    }
    if (normalized === 'on-leave') {
      return 'warning';
    }
    if (normalized === 'resigned' || normalized === 'terminated') {
      return 'danger';
    }
    return 'neutral';
  }

  private readEmployeeDraft(payload: Record<string, unknown>): {
    firstName: string;
    lastName: string;
    email: string;
    departmentId?: string;
    designationId?: string;
    locationId?: string;
    managerId?: string;
    status?: string;
    startDate: string;
    phone?: string;
    address?: string;
    gender?: string;
    dob?: string;
  } {
    return {
      firstName: this.readText(payload, 'firstName'),
      lastName: this.readText(payload, 'lastName'),
      email: this.readText(payload, 'email'),
      departmentId: this.readText(payload, 'departmentId'),
      designationId: this.readText(payload, 'designationId'),
      locationId: this.readText(payload, 'locationId'),
      managerId: this.readText(payload, 'managerId'),
      status: this.readText(payload, 'status'),
      startDate: this.readText(payload, 'startDate'),
      phone: this.readText(payload, 'phone'),
      address: this.readText(payload, 'address'),
      gender: this.readText(payload, 'gender'),
      dob: this.readText(payload, 'dob')
    };
  }

  private readText(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];
    return typeof value === 'string' ? value : '';
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
