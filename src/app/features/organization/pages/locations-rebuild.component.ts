import { Component, inject, signal } from '@angular/core';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';

@Component({
  selector: 'app-locations-rebuild',
  standalone: true,
  imports: [UiModalComponent, DynamicFormComponent],
  template: `
    <main class="min-h-screen bg-stone-50 px-4 py-8 text-stone-900 dark:bg-[#0b0b0b] dark:text-stone-100 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Organization Rebuild</p>
          <h1 class="text-3xl font-semibold tracking-tight">Locations</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Office and site footprint scaffolding for the rebuilt organization module.
          </p>
        </header>

        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-stone-600 dark:text-stone-300">Use step-based modal forms to capture location identity and address context.</p>
            <button
              type="button"
              class="rounded-[10px] bg-burgundy-700 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(134,24,33,0.35)] transition-all hover:-translate-y-0.5 hover:bg-burgundy-600"
              (click)="openCreateModal()"
            >
              Add Location
            </button>
          </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl">
          <table class="min-w-full text-left">
            <thead class="bg-stone-50 dark:bg-white/[0.03]">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Location</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">City</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Country</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (location of locations(); track location.id) {
                <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                  <td class="px-4 py-3 text-sm font-medium text-stone-800 dark:text-stone-200">{{ location.name }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ location.city }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ location.country }}</td>
                  <td class="px-4 py-3 text-right">
                    <button
                      type="button"
                      class="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-white/10 dark:text-stone-300 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                      (click)="removeLocation(location.id)"
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
        width="wide"
        title="Create Location"
      >
        <app-dynamic-form
          container="modal"
          [fields]="locationFields"
          [sections]="locationSections"
          [steps]="locationSteps"
          [showCancel]="true"
          submitLabel="Create Location"
          (cancel)="closeCreateModal()"
          (formSubmit)="createLocationFromForm($event)"
        />
      </ui-modal>
    </main>
  `
})
export class LocationsRebuildComponent {
  private readonly store = inject(OrganizationRebuildStore);

  readonly locations = this.store.locations;
  readonly isCreateModalOpen = signal(false);

  readonly locationFields: FieldConfig[] = [
    {
      name: 'name',
      label: 'Location Name',
      type: 'text',
      sectionId: 'identity',
      required: true,
      placeholder: 'e.g. Nairobi HQ'
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
      sectionId: 'address',
      required: true,
      placeholder: 'e.g. Nairobi'
    },
    {
      name: 'country',
      label: 'Country',
      type: 'text',
      sectionId: 'address',
      required: true,
      placeholder: 'e.g. Kenya'
    }
  ];

  readonly locationSections: FormSectionConfig[] = [
    {
      id: 'identity',
      title: 'Identity',
      description: 'Primary location naming',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'address',
      title: 'Address',
      description: 'City and country details',
      columns: { base: 1, md: 2, lg: 2 }
    }
  ];

  readonly locationSteps: FormStepConfig[] = [
    { id: 'loc-step-1', title: 'Identity', sectionIds: ['identity'] },
    { id: 'loc-step-2', title: 'Address', sectionIds: ['address'] }
  ];

  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  createLocationFromForm(payload: Record<string, unknown>): void {
    const name = typeof payload['name'] === 'string' ? payload['name'] : '';
    const city = typeof payload['city'] === 'string' ? payload['city'] : '';
    const country = typeof payload['country'] === 'string' ? payload['country'] : '';
    this.store.addLocation(name, city, country);
    this.isCreateModalOpen.set(false);
  }

  removeLocation(id: string): void {
    this.store.removeLocation(id);
  }
}
