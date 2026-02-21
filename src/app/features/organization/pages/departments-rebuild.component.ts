import { Component, OnInit, inject, signal } from '@angular/core';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { OrganizationTableActionsComponent } from '../components/organization-table-actions.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { OrganizationPageStateComponent } from '../components/organization-page-state.component';
import { RebuildDepartment } from '../data/organization-rebuild.models';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';

@Component({
  selector: 'app-departments-rebuild',
  standalone: true,
  imports: [UiModalComponent, DynamicFormComponent, UiConfirmDialogComponent, OrganizationPageStateComponent, OrganizationTableActionsComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Organization Rebuild</p>
          <h1 class="text-3xl font-semibold tracking-tight">Departments</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Convex-backed department setup with multi-step modal forms and destructive-action confirmation.
          </p>
        </header>

        <app-organization-page-state
          [error]="error()"
          [isLoading]="departmentsLoading()"
          [hasData]="departments().length > 0"
          loadingLabel="Loading departments..."
          emptyTitle="No departments found"
          emptyMessage="Create a department to begin structuring teams."
          (retryRequested)="refreshDepartments()"
        />

        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-stone-600 dark:text-stone-300">Use structured modal forms with stepper flows and explicit manager assignment.</p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-[10px] border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/8 dark:text-stone-200 dark:hover:bg-white/10"
                [disabled]="departmentsLoading() || isSaving()"
                (click)="refreshDepartments()"
              >
                Refresh
              </button>
              <button
                type="button"
                class="rounded-[10px] bg-burgundy-700 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(134,24,33,0.35)] transition-all hover:-translate-y-0.5 hover:bg-burgundy-600 disabled:cursor-not-allowed disabled:opacity-60"
                [disabled]="departmentsLoading() || isSaving()"
                (click)="openCreateModal()"
              >
                Add Department
              </button>
            </div>
          </div>
        </section>

        @if (departments().length > 0) {
        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="overflow-x-auto">
          <table class="min-w-full text-left">
            <thead class="bg-stone-50 dark:bg-white/[0.03]">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Department Name</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Code</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Manager</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Headcount</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Description</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (department of departments(); track department.id) {
                <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                  <td class="px-4 py-3 text-sm font-medium text-stone-800 dark:text-stone-200">{{ department.name }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ department.code }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ managerLabel(department) }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ department.headcount }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ department.description || 'n/a' }}</td>
                  <td class="px-4 py-3 text-right">
                    <app-organization-table-actions
                      [disabled]="isSaving()"
                      (editRequested)="openEditModal(department)"
                      (removeRequested)="requestDepartmentRemoval(department.id)"
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
          </div>
        </section>
        }
      </div>

      <ui-modal
        [isOpen]="isCreateModalOpen()"
        (isOpenChange)="isCreateModalOpen.set($event)"
        [canDismiss]="true"
        [hasFooter]="false"
        width="normal"
        title="Create Department"
      >
        <app-dynamic-form
          container="modal"
          [fields]="departmentFields"
          [sections]="departmentSections"
          [steps]="departmentSteps"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Create Department"
          (cancel)="closeCreateModal()"
          (formSubmit)="createDepartmentFromForm($event)"
        />
      </ui-modal>

      <ui-modal
        [isOpen]="isEditModalOpen()"
        (isOpenChange)="isEditModalOpen.set($event)"
        [canDismiss]="true"
        [hasFooter]="false"
        width="normal"
        title="Edit Department"
      >
        <app-dynamic-form
          container="modal"
          [fields]="departmentFields"
          [sections]="departmentSections"
          [steps]="departmentSteps"
          [initialValues]="editInitialValues()"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Save Changes"
          (cancel)="closeEditModal()"
          (formSubmit)="updateDepartmentFromForm($event)"
        />
      </ui-modal>

      <ui-confirm-dialog
        [isOpen]="isDeleteDialogOpen()"
        (isOpenChange)="isDeleteDialogOpen.set($event)"
        [options]="deleteDialogOptions"
        (confirm)="confirmDepartmentRemoval()"
      />
    </main>
  `
})
export class DepartmentsRebuildComponent implements OnInit {
  private readonly store = inject(OrganizationRebuildStore);

  readonly departments = this.store.departments;
  readonly managerLookup = this.store.managerLookup;
  readonly departmentsLoading = this.store.departmentsLoading;
  readonly isSaving = this.store.isSaving;
  readonly error = this.store.error;
  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly isDeleteDialogOpen = signal(false);
  readonly editInitialValues = signal<Record<string, unknown>>({});
  readonly editingDepartmentId = signal<string | null>(null);
  readonly pendingDeleteDepartmentId = signal<string | null>(null);

  readonly deleteDialogOptions: ConfirmDialogOptions = {
    title: 'Remove Department',
    message: 'This will permanently remove the department record. This action cannot be undone.',
    confirmText: 'Remove',
    cancelText: 'Cancel',
    variant: 'danger'
  };

  get departmentFields(): FieldConfig[] {
    return [
      {
        name: 'name',
        label: 'Department Name',
        type: 'text',
        sectionId: 'identity',
        required: true,
        colSpan: 2,
        placeholder: 'e.g. Finance'
      },
      {
        name: 'code',
        label: 'Department Code',
        type: 'text',
        sectionId: 'identity',
        required: true,
        placeholder: 'e.g. FIN'
      },
      {
        name: 'managerId',
        label: 'Department Manager',
        type: 'select',
        sectionId: 'planning',
        required: false,
        options: this.managerLookup()
          .filter((employee) => employee.status.trim().toLowerCase() === 'active')
          .map((employee) => ({
          label: `${employee.firstName} ${employee.lastName} (${employee.email})`,
          value: employee.id
        }))
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        sectionId: 'planning',
        required: false,
        colSpan: 2,
        placeholder: 'Optional context about this department'
      }
    ];
  }

  readonly departmentSections: FormSectionConfig[] = [
    {
      id: 'identity',
      title: 'Identity',
      description: 'Core department metadata',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'planning',
      title: 'Planning',
      description: 'Optional planning baseline',
      columns: { base: 1, md: 2, lg: 2 }
    }
  ];

  readonly departmentSteps: FormStepConfig[] = [
    { id: 'dept-step-1', title: 'Department Details', sectionIds: ['identity'] },
    { id: 'dept-step-2', title: 'Workforce Plan', sectionIds: ['planning'] }
  ];

  ngOnInit(): void {
    void this.store.loadDepartments();
  }

  refreshDepartments(): void {
    void this.store.loadDepartments();
  }

  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
    this.store.clearError();
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  openEditModal(department: RebuildDepartment): void {
    this.editingDepartmentId.set(department.id);
    this.editInitialValues.set({
      name: department.name,
      code: department.code,
      managerId: department.managerId ?? '',
      description: department.description
    });
    this.isEditModalOpen.set(true);
    this.store.clearError();
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingDepartmentId.set(null);
  }

  async createDepartmentFromForm(payload: Record<string, unknown>): Promise<void> {
    const success = await this.store.addDepartment({
      name: this.readText(payload, 'name'),
      code: this.readText(payload, 'code'),
      managerId: this.readText(payload, 'managerId'),
      description: this.readText(payload, 'description')
    });
    if (success) {
      this.isCreateModalOpen.set(false);
    }
  }

  async updateDepartmentFromForm(payload: Record<string, unknown>): Promise<void> {
    const id = this.editingDepartmentId();
    if (!id) {
      return;
    }

    const success = await this.store.updateDepartment({
      id,
      name: this.readText(payload, 'name'),
      code: this.readText(payload, 'code'),
      managerId: this.readText(payload, 'managerId'),
      description: this.readText(payload, 'description')
    });
    if (success) {
      this.closeEditModal();
    }
  }

  requestDepartmentRemoval(id: string): void {
    this.pendingDeleteDepartmentId.set(id);
    this.isDeleteDialogOpen.set(true);
    this.store.clearError();
  }

  managerLabel(department: RebuildDepartment): string {
    if (!department.managerId) {
      return 'Unassigned';
    }
    if (!department.managerName) {
      return 'Unavailable manager';
    }
    if (department.managerStatus?.trim().toLowerCase() !== 'active') {
      return `${department.managerName} (inactive)`;
    }
    return department.managerName;
  }

  async confirmDepartmentRemoval(): Promise<void> {
    const id = this.pendingDeleteDepartmentId();
    if (!id) {
      return;
    }
    const success = await this.store.removeDepartment(id);
    if (success) {
      this.pendingDeleteDepartmentId.set(null);
      this.isDeleteDialogOpen.set(false);
    }
  }

  private readText(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];
    return typeof value === 'string' ? value : '';
  }
}
