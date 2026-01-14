import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiDataTableComponent, TableColumn } from '../../../shared/components/ui-data-table/ui-data-table.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../../shared/services/form-helper.service';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { api } from '../../../../../convex/_generated/api';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [CommonModule, UiDataTableComponent, UiButtonComponent, UiModalComponent, DynamicFormComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Locations</h2>
          <p class="text-gray-600">Manage office locations.</p>
        </div>
        <ui-button (onClick)="openCreateModal()">Add Location</ui-button>
      </div>

      <ui-data-table
        [data]="locations()"
        [columns]="columns"
        [loading]="loading()"
        [actionsTemplate]="actionsRef"
      ></ui-data-table>

      <ng-template #actionsRef let-row>
        <div class="flex gap-2 justify-end">
          <ui-button variant="ghost" size="sm" (onClick)="openEditModal(row)">Edit</ui-button>
          <ui-button variant="ghost" size="sm" class="text-red-600 hover:text-red-700 hover:bg-red-50" (onClick)="deleteLocation(row)">Delete</ui-button>
        </div>
      </ng-template>

      <ui-modal
        [(isOpen)]="showModal"
        [title]="isEditing() ? 'Edit Location' : 'Add Location'"
      >
        <app-dynamic-form
          [fields]="formConfig"
          [initialValues]="currentLocation() || {}"
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
export class LocationsComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);

  locations = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);

  showModal = signal(false);
  isEditing = signal(false);
  currentLocation = signal<any>(null);

  private unsubscribe: (() => void) | null = null;

  columns: TableColumn[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'city', header: 'City', sortable: true },
    { key: 'country', header: 'Country', sortable: true },
    { key: 'address', header: 'Address' }
  ];

  formConfig: FieldConfig[] = [
    { name: 'name', label: 'Location Name', type: 'text', required: true, placeholder: 'e.g. HQ' },
    { name: 'address', label: 'Address', type: 'textarea', required: true, placeholder: 'Full address' },
    { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'e.g. New York' },
    { name: 'country', label: 'Country', type: 'text', required: true, placeholder: 'e.g. USA' }
  ];

  ngOnInit() {
    const client = this.convexService.getClient();
    this.unsubscribe = client.onUpdate(api.organization.listLocations, {}, (data) => {
      this.locations.set(data);
      this.loading.set(false);
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.currentLocation.set(null);
    this.showModal.set(true);
  }

  openEditModal(row: any) {
    this.isEditing.set(true);
    this.currentLocation.set(row);
    this.showModal.set(true);
  }

  async onSubmit(formData: any) {
    this.submitting.set(true);
    const client = this.convexService.getClient();

    try {
      if (this.isEditing()) {
        const id = this.currentLocation()._id;
        await client.mutation(api.organization.updateLocation, {
          id,
          name: formData.name,
          address: formData.address,
          city: formData.city,
          country: formData.country
        });
      } else {
        await client.mutation(api.organization.createLocation, {
          name: formData.name,
          address: formData.address,
          city: formData.city,
          country: formData.country
        });
      }
      this.showModal.set(false);
    } catch (error) {
      console.error('Error saving location:', error);
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteLocation(row: any) {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const client = this.convexService.getClient();
      await client.mutation(api.organization.deleteLocation, { id: row._id });
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  }
}
