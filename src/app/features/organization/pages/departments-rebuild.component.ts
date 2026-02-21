import { Component, inject, signal } from '@angular/core';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';

@Component({
  selector: 'app-departments-rebuild',
  standalone: true,
  imports: [UiModalComponent, DynamicFormComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Organization Rebuild</p>
          <h1 class="text-3xl font-semibold tracking-tight">Departments</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Rebuilt with shared modal + dynamic-form primitives. Data is local scaffold until Convex integration is reintroduced.
          </p>
        </header>

        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-stone-600 dark:text-stone-300">Use structured modal forms with stepper flows for cleaner UX in constrained spaces.</p>
            <button
              type="button"
              class="rounded-[10px] bg-burgundy-700 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(134,24,33,0.35)] transition-all hover:-translate-y-0.5 hover:bg-burgundy-600"
              (click)="openCreateModal()"
            >
              Add Department
            </button>
          </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="overflow-x-auto">
          <table class="min-w-full text-left">
            <thead class="bg-stone-50 dark:bg-white/[0.03]">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Department Name</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Headcount</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (department of departments(); track department.id) {
                <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                  <td class="px-4 py-3 text-sm font-medium text-stone-800 dark:text-stone-200">{{ department.name }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ department.headcount }}</td>
                  <td class="px-4 py-3 text-right">
                    <button
                      type="button"
                      class="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-white/8 dark:text-stone-300 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                      (click)="removeDepartment(department.id)"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          </div>
        </section>
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
          [showCancel]="true"
          submitLabel="Create Department"
          (cancel)="closeCreateModal()"
          (formSubmit)="createDepartmentFromForm($event)"
        />
      </ui-modal>
    </main>
  `
})
export class DepartmentsRebuildComponent {
  private readonly store = inject(OrganizationRebuildStore);

  readonly departments = this.store.departments;
  readonly isCreateModalOpen = signal(false);

  readonly departmentFields: FieldConfig[] = [
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
      name: 'headcount',
      label: 'Initial Headcount',
      type: 'number',
      sectionId: 'planning',
      required: false,
      placeholder: 'e.g. 0'
    }
  ];

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

  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  createDepartmentFromForm(payload: Record<string, unknown>): void {
    this.store.addDepartment(typeof payload['name'] === 'string' ? payload['name'] : '');
    this.isCreateModalOpen.set(false);
  }

  removeDepartment(id: string): void {
    this.store.removeDepartment(id);
  }
}
