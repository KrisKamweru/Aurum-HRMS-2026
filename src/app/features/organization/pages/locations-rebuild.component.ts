import { Component, OnInit, inject, signal } from '@angular/core';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { OrganizationTableActionsComponent } from '../components/organization-table-actions.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { OrganizationPageStateComponent } from '../components/organization-page-state.component';
import { RebuildLocation } from '../data/organization-rebuild.models';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';

@Component({
  selector: 'app-locations-rebuild',
  standalone: true,
  imports: [UiModalComponent, DynamicFormComponent, UiConfirmDialogComponent, OrganizationPageStateComponent, OrganizationTableActionsComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Organization Rebuild</p>
          <h1 class="text-3xl font-semibold tracking-tight">Locations</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Convex-backed site footprint setup with editable location metadata.
          </p>
        </header>

        <app-organization-page-state
          [error]="error()"
          [isLoading]="locationsLoading()"
          [hasData]="locations().length > 0"
          loadingLabel="Loading locations..."
          loadingVariant="table"
          emptyTitle="No locations found"
          emptyMessage="Add a location to define operational sites."
          (retryRequested)="refreshLocations()"
        />

        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-stone-600 dark:text-stone-300">Use step-based modal forms to capture location identity and address context.</p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-[10px] border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/8 dark:text-stone-200 dark:hover:bg-white/10"
                [disabled]="locationsLoading() || isSaving()"
                (click)="refreshLocations()"
              >
                Refresh
              </button>
              <button
                type="button"
                class="rounded-[10px] bg-burgundy-700 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(134,24,33,0.35)] transition-all hover:-translate-y-0.5 hover:bg-burgundy-600 disabled:cursor-not-allowed disabled:opacity-60"
                [disabled]="locationsLoading() || isSaving()"
                (click)="openCreateModal()"
              >
                Add Location
              </button>
            </div>
          </div>
        </section>

        @if (locations().length > 0) {
        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="overflow-x-auto">
          <table class="min-w-full text-left">
            <thead class="bg-stone-50 dark:bg-white/[0.03]">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Location</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Address</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">City</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Country</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (location of locations(); track location.id) {
                <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                  <td class="px-4 py-3 text-sm font-medium text-stone-800 dark:text-stone-200">{{ location.name }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ location.address }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ location.city }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ location.country }}</td>
                  <td class="px-4 py-3 text-right">
                    <app-organization-table-actions
                      [disabled]="isSaving()"
                      (editRequested)="openEditModal(location)"
                      (removeRequested)="requestLocationRemoval(location.id)"
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
        width="wide"
        title="Create Location"
      >
        <app-dynamic-form
          container="modal"
          [fields]="locationFields"
          [sections]="locationSections"
          [steps]="locationSteps"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Create Location"
          (cancel)="closeCreateModal()"
          (formSubmit)="createLocationFromForm($event)"
        />
      </ui-modal>

      <ui-modal
        [isOpen]="isEditModalOpen()"
        (isOpenChange)="isEditModalOpen.set($event)"
        [canDismiss]="true"
        [hasFooter]="false"
        width="wide"
        title="Edit Location"
      >
        <app-dynamic-form
          container="modal"
          [fields]="locationFields"
          [sections]="locationSections"
          [steps]="locationSteps"
          [initialValues]="editInitialValues()"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Save Changes"
          (cancel)="closeEditModal()"
          (formSubmit)="updateLocationFromForm($event)"
        />
      </ui-modal>

      <ui-confirm-dialog
        [isOpen]="isDeleteDialogOpen()"
        (isOpenChange)="isDeleteDialogOpen.set($event)"
        [options]="deleteDialogOptions"
        (confirm)="confirmLocationRemoval()"
      />
    </main>
  `
})
export class LocationsRebuildComponent implements OnInit {
  private readonly store = inject(OrganizationRebuildStore);

  readonly locations = this.store.locations;
  readonly locationsLoading = this.store.locationsLoading;
  readonly isSaving = this.store.isSaving;
  readonly error = this.store.error;
  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly isDeleteDialogOpen = signal(false);
  readonly editInitialValues = signal<Record<string, unknown>>({});
  readonly editingLocationId = signal<string | null>(null);
  readonly pendingDeleteLocationId = signal<string | null>(null);

  readonly deleteDialogOptions: ConfirmDialogOptions = {
    title: 'Remove Location',
    message: 'This will permanently remove the location record. This action cannot be undone.',
    confirmText: 'Remove',
    cancelText: 'Cancel',
    variant: 'danger'
  };

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
      name: 'address',
      label: 'Address',
      type: 'textarea',
      sectionId: 'identity',
      required: true,
      colSpan: 2,
      placeholder: 'e.g. 1 Riverside Plaza'
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

  ngOnInit(): void {
    void this.store.loadLocations();
  }

  refreshLocations(): void {
    void this.store.loadLocations();
  }

  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
    this.store.clearError();
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  openEditModal(location: RebuildLocation): void {
    this.editingLocationId.set(location.id);
    this.editInitialValues.set({
      name: location.name,
      address: location.address,
      city: location.city,
      country: location.country
    });
    this.isEditModalOpen.set(true);
    this.store.clearError();
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingLocationId.set(null);
  }

  async createLocationFromForm(payload: Record<string, unknown>): Promise<void> {
    const success = await this.store.addLocation({
      name: this.readText(payload, 'name'),
      address: this.readText(payload, 'address'),
      city: this.readText(payload, 'city'),
      country: this.readText(payload, 'country')
    });
    if (success) {
      this.isCreateModalOpen.set(false);
    }
  }

  async updateLocationFromForm(payload: Record<string, unknown>): Promise<void> {
    const id = this.editingLocationId();
    if (!id) {
      return;
    }
    const success = await this.store.updateLocation({
      id,
      name: this.readText(payload, 'name'),
      address: this.readText(payload, 'address'),
      city: this.readText(payload, 'city'),
      country: this.readText(payload, 'country')
    });
    if (success) {
      this.closeEditModal();
    }
  }

  requestLocationRemoval(id: string): void {
    this.pendingDeleteLocationId.set(id);
    this.isDeleteDialogOpen.set(true);
    this.store.clearError();
  }

  async confirmLocationRemoval(): Promise<void> {
    const id = this.pendingDeleteLocationId();
    if (!id) {
      return;
    }
    const success = await this.store.removeLocation(id);
    if (success) {
      this.pendingDeleteLocationId.set(null);
      this.isDeleteDialogOpen.set(false);
    }
  }

  private readText(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];
    return typeof value === 'string' ? value : '';
  }
}
