import { Component, inject, signal } from '@angular/core';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';

@Component({
  selector: 'app-designations-rebuild',
  standalone: true,
  imports: [UiModalComponent, DynamicFormComponent],
  template: `
    <main class="min-h-screen bg-stone-50 px-4 py-8 text-stone-900 dark:bg-[#0b0b0b] dark:text-stone-100 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Organization Rebuild</p>
          <h1 class="text-3xl font-semibold tracking-tight">Designations</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Role ladder and job title scaffolding for the rebuilt organization module.
          </p>
        </header>

        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-stone-600 dark:text-stone-300">Use structured modal forms for designation setup and validation.</p>
            <button
              type="button"
              class="rounded-[10px] bg-burgundy-700 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(134,24,33,0.35)] transition-all hover:-translate-y-0.5 hover:bg-burgundy-600"
              (click)="openCreateModal()"
            >
              Add Designation
            </button>
          </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl">
          <table class="min-w-full text-left">
            <thead class="bg-stone-50 dark:bg-white/[0.03]">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Designation</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Level</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (designation of designations(); track designation.id) {
                <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                  <td class="px-4 py-3 text-sm font-medium text-stone-800 dark:text-stone-200">{{ designation.title }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ designation.level }}</td>
                  <td class="px-4 py-3 text-right">
                    <button
                      type="button"
                      class="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-white/10 dark:text-stone-300 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                      (click)="removeDesignation(designation.id)"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
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
          [showCancel]="true"
          submitLabel="Create Designation"
          (cancel)="closeCreateModal()"
          (formSubmit)="createDesignationFromForm($event)"
        />
      </ui-modal>
    </main>
  `
})
export class DesignationsRebuildComponent {
  private readonly store = inject(OrganizationRebuildStore);

  readonly designations = this.store.designations;
  readonly isCreateModalOpen = signal(false);

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
      name: 'level',
      label: 'Level',
      type: 'number',
      sectionId: 'grading',
      required: true,
      placeholder: 'e.g. 3'
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
    }
  ];

  readonly designationSteps: FormStepConfig[] = [
    { id: 'desig-step-1', title: 'Title', sectionIds: ['identity'] },
    { id: 'desig-step-2', title: 'Grade', sectionIds: ['grading'] }
  ];

  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  createDesignationFromForm(payload: Record<string, unknown>): void {
    const title = typeof payload['title'] === 'string' ? payload['title'] : '';
    const parsedLevel = Number(payload['level']);
    const level = Number.isFinite(parsedLevel) && parsedLevel > 0 ? parsedLevel : 1;
    this.store.addDesignation(title, level);
    this.isCreateModalOpen.set(false);
  }

  removeDesignation(id: string): void {
    this.store.removeDesignation(id);
  }
}
