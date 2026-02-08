import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiDataTableComponent, TableColumn } from '../../../shared/components/ui-data-table/ui-data-table.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../../shared/services/form-helper.service';
import { UiGridComponent } from '../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../shared/components/ui-grid/ui-grid-tile.component';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { api } from '../../../../../convex/_generated/api';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [CommonModule, UiDataTableComponent, UiButtonComponent, UiModalComponent, UiIconComponent, DynamicFormComponent, UiGridComponent, UiGridTileComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">Locations</h1>
          <p class="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Manage office locations.</p>
        </div>
        @if (canManage()) {
          <ui-button (onClick)="openCreateModal()">
            <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
            Add Location
          </ui-button>
        }
      </div>

      <div class="dash-frame">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="Locations" variant="compact">
            <div class="tile-body">
              <ui-data-table
                [data]="locations()"
                [columns]="columns"
                [loading]="loading()"
                [actionsTemplate]="canManage() ? actionsRef : undefined"
                headerVariant="neutral"
              ></ui-data-table>
            </div>
          </ui-grid-tile>
        </ui-grid>
      </div>

      <ng-template #actionsRef let-row>
        <div class="flex gap-2 justify-end">
          <button
            class="p-1.5 text-stone-400 hover:text-burgundy-700 hover:bg-burgundy-50 dark:hover:text-burgundy-200 dark:hover:bg-burgundy-900/20 rounded-lg transition-colors"
            (click)="openEditModal(row)"
            title="Edit"
          >
            <ui-icon name="pencil" class="w-4 h-4"></ui-icon>
          </button>
          <button
            class="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            (click)="deleteLocation(row)"
            title="Delete"
          >
            <ui-icon name="trash" class="w-4 h-4"></ui-icon>
          </button>
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
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);

  canManage = this.authService.hasRole(['super_admin', 'admin', 'hr_manager']);

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
      this.toastService.success(this.isEditing() ? 'Location updated successfully' : 'Location created successfully');
    } catch (error) {
      console.error('Error saving location:', error);
      this.toastService.error('Failed to save location. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteLocation(row: any) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Location',
      message: 'Are you sure you want to delete this location? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      const client = this.convexService.getClient();
      await client.mutation(api.organization.deleteLocation, { id: row._id });
      this.toastService.success('Location deleted successfully');
    } catch (error) {
      console.error('Error deleting location:', error);
      this.toastService.error('Failed to delete location. Please try again.');
    }
  }
}
