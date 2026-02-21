import { Component, OnInit, inject, signal } from '@angular/core';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { OrganizationTableActionsComponent } from '../components/organization-table-actions.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { OrganizationPageStateComponent } from '../components/organization-page-state.component';
import { RebuildDesignation } from '../data/organization-rebuild.models';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';

@Component({
  selector: 'app-designations-rebuild',
  standalone: true,
  imports: [UiModalComponent, DynamicFormComponent, UiConfirmDialogComponent, OrganizationPageStateComponent, OrganizationTableActionsComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Organization Rebuild</p>
          <h1 class="text-3xl font-semibold tracking-tight">Designations</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Convex-backed role ladder management with editable job architecture.
          </p>
        </header>

        <app-organization-page-state
          [error]="error()"
          [isLoading]="designationsLoading()"
          [hasData]="designations().length > 0"
          loadingLabel="Loading designations..."
          emptyTitle="No designations found"
          emptyMessage="Add at least one designation to define your role ladder."
        />

        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-stone-600 dark:text-stone-300">Use structured modal forms for designation setup and validation.</p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-[10px] border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/8 dark:text-stone-200 dark:hover:bg-white/10"
                [disabled]="designationsLoading() || isSaving()"
                (click)="refreshDesignations()"
              >
                Refresh
              </button>
              <button
                type="button"
                class="rounded-[10px] bg-burgundy-700 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(134,24,33,0.35)] transition-all hover:-translate-y-0.5 hover:bg-burgundy-600 disabled:cursor-not-allowed disabled:opacity-60"
                [disabled]="designationsLoading() || isSaving()"
                (click)="openCreateModal()"
              >
                Add Designation
              </button>
            </div>
          </div>
        </section>

        @if (designations().length > 0) {
        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="overflow-x-auto">
          <table class="min-w-full text-left">
            <thead class="bg-stone-50 dark:bg-white/[0.03]">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Designation</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Code</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Level</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Description</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (designation of designations(); track designation.id) {
                <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                  <td class="px-4 py-3 text-sm font-medium text-stone-800 dark:text-stone-200">{{ designation.title }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ designation.code }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ designation.level ?? 'n/a' }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ designation.description || 'n/a' }}</td>
                  <td class="px-4 py-3 text-right">
                    <app-organization-table-actions
                      [disabled]="isSaving()"
                      (editRequested)="openEditModal(designation)"
                      (removeRequested)="requestDesignationRemoval(designation.id)"
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
        title="Create Designation"
      >
        <app-dynamic-form
          container="modal"
          [fields]="designationFields"
          [sections]="designationSections"
          [steps]="designationSteps"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Create Designation"
          (cancel)="closeCreateModal()"
          (formSubmit)="createDesignationFromForm($event)"
        />
      </ui-modal>

      <ui-modal
        [isOpen]="isEditModalOpen()"
        (isOpenChange)="isEditModalOpen.set($event)"
        [canDismiss]="true"
        [hasFooter]="false"
        width="normal"
        title="Edit Designation"
      >
        <app-dynamic-form
          container="modal"
          [fields]="designationFields"
          [sections]="designationSections"
          [steps]="designationSteps"
          [initialValues]="editInitialValues()"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Save Changes"
          (cancel)="closeEditModal()"
          (formSubmit)="updateDesignationFromForm($event)"
        />
      </ui-modal>

      <ui-confirm-dialog
        [isOpen]="isDeleteDialogOpen()"
        (isOpenChange)="isDeleteDialogOpen.set($event)"
        [options]="deleteDialogOptions"
        (confirm)="confirmDesignationRemoval()"
      />
    </main>
  `
})
export class DesignationsRebuildComponent implements OnInit {
  private readonly store = inject(OrganizationRebuildStore);

  readonly designations = this.store.designations;
  readonly designationsLoading = this.store.designationsLoading;
  readonly isSaving = this.store.isSaving;
  readonly error = this.store.error;
  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly isDeleteDialogOpen = signal(false);
  readonly editInitialValues = signal<Record<string, unknown>>({});
  readonly editingDesignationId = signal<string | null>(null);
  readonly pendingDeleteDesignationId = signal<string | null>(null);

  readonly deleteDialogOptions: ConfirmDialogOptions = {
    title: 'Remove Designation',
    message: 'This will permanently remove the designation record. This action cannot be undone.',
    confirmText: 'Remove',
    cancelText: 'Cancel',
    variant: 'danger'
  };

  readonly designationFields: FieldConfig[] = [
    {
      name: 'title',
      label: 'Designation Title',
      type: 'text',
      sectionId: 'identity',
      required: true,
      colSpan: 2,
      placeholder: 'e.g. Senior Engineer'
    },
    {
      name: 'code',
      label: 'Designation Code',
      type: 'text',
      sectionId: 'identity',
      required: true,
      placeholder: 'e.g. SNR_ENG'
    },
    {
      name: 'level',
      label: 'Level',
      type: 'number',
      sectionId: 'grading',
      required: true,
      placeholder: 'e.g. 3'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      sectionId: 'context',
      colSpan: 2,
      placeholder: 'Optional notes for this role'
    }
  ];

  readonly designationSections: FormSectionConfig[] = [
    {
      id: 'identity',
      title: 'Title',
      description: 'Designation naming and identity',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'grading',
      title: 'Grade',
      description: 'Role hierarchy level',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'context',
      title: 'Context',
      description: 'Additional role description',
      columns: { base: 1, md: 2, lg: 2 }
    }
  ];

  readonly designationSteps: FormStepConfig[] = [
    { id: 'desig-step-1', title: 'Title', sectionIds: ['identity'] },
    { id: 'desig-step-2', title: 'Grade', sectionIds: ['grading'] },
    { id: 'desig-step-3', title: 'Context', sectionIds: ['context'] }
  ];

  ngOnInit(): void {
    void this.store.loadDesignations();
  }

  refreshDesignations(): void {
    void this.store.loadDesignations();
  }

  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
    this.store.clearError();
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  openEditModal(designation: RebuildDesignation): void {
    this.editingDesignationId.set(designation.id);
    this.editInitialValues.set({
      title: designation.title,
      code: designation.code,
      level: designation.level ?? '',
      description: designation.description
    });
    this.isEditModalOpen.set(true);
    this.store.clearError();
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingDesignationId.set(null);
  }

  async createDesignationFromForm(payload: Record<string, unknown>): Promise<void> {
    const success = await this.store.addDesignation({
      title: this.readText(payload, 'title'),
      code: this.readText(payload, 'code'),
      level: this.readOptionalLevel(payload, 'level'),
      description: this.readText(payload, 'description')
    });
    if (success) {
      this.isCreateModalOpen.set(false);
    }
  }

  async updateDesignationFromForm(payload: Record<string, unknown>): Promise<void> {
    const id = this.editingDesignationId();
    if (!id) {
      return;
    }
    const success = await this.store.updateDesignation({
      id,
      title: this.readText(payload, 'title'),
      code: this.readText(payload, 'code'),
      level: this.readOptionalLevel(payload, 'level'),
      description: this.readText(payload, 'description')
    });
    if (success) {
      this.closeEditModal();
    }
  }

  requestDesignationRemoval(id: string): void {
    this.pendingDeleteDesignationId.set(id);
    this.isDeleteDialogOpen.set(true);
    this.store.clearError();
  }

  async confirmDesignationRemoval(): Promise<void> {
    const id = this.pendingDeleteDesignationId();
    if (!id) {
      return;
    }
    const success = await this.store.removeDesignation(id);
    if (success) {
      this.pendingDeleteDesignationId.set(null);
      this.isDeleteDialogOpen.set(false);
    }
  }

  private readText(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];
    return typeof value === 'string' ? value : '';
  }

  private readOptionalLevel(payload: Record<string, unknown>, key: string): number | undefined {
    const raw = payload[key];
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
      return undefined;
    }
    return value;
  }
}
