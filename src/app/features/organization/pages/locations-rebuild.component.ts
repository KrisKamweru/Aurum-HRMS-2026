import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { OrganizationListShellComponent } from '../components/organization-list-shell.component';
import { OrganizationListToolbarActionsComponent } from '../components/organization-list-toolbar-actions.component';
import { OrganizationTableColumn, OrganizationTableHeaderRowComponent } from '../components/organization-table-header-row.component';
import { OrganizationTableMetadataComponent } from '../components/organization-table-metadata.component';
import { OrganizationTableActionsComponent } from '../components/organization-table-actions.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { OrganizationPageStateComponent } from '../components/organization-page-state.component';
import { RebuildLocation } from '../data/organization-rebuild.models';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-locations-rebuild',
  imports: [UiModalComponent, UiBadgeComponent, DynamicFormComponent, UiConfirmDialogComponent, OrganizationPageStateComponent, OrganizationListShellComponent, OrganizationListToolbarActionsComponent, OrganizationTableHeaderRowComponent, OrganizationTableMetadataComponent, OrganizationTableActionsComponent],
  template: ''
})
export class LocationsRebuildComponent implements OnInit {
  private readonly store = inject(OrganizationRebuildStore);

  readonly locations = this.store.locations;
  readonly locationsLoading = this.store.locationsLoading;
  readonly isSaving = this.store.isSaving;
  readonly error = this.store.error;
  readonly lastRefreshedAt = signal<Date | null>(null);
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

  readonly locationColumns: OrganizationTableColumn[] = [
    { label: 'Location' },
    { label: 'Address' },
    { label: 'City' },
    { label: 'Country' },
    { label: 'Actions', align: 'right' }
  ];

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
    this.refreshLocations();
  }

  refreshLocations(): void {
    this.lastRefreshedAt.set(new Date());
    void this.store.loadLocations();
  }

  countryCount(): number {
    return this.uniqueLocationCount((location) => location.country);
  }

  cityCount(): number {
    return this.uniqueLocationCount((location) => location.city);
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

  private uniqueLocationCount(selector: (location: RebuildLocation) => string): number {
    const values = new Set(
      this.locations()
        .map((location) => selector(location).trim().toLowerCase())
        .filter((value) => value.length > 0)
    );
    return values.size;
  }
}


