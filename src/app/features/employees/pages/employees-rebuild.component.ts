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
  template: ''
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
