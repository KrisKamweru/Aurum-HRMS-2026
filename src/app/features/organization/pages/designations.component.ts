import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiDataTableComponent, TableColumn } from '../../../shared/components/ui-data-table/ui-data-table.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../../shared/services/form-helper.service';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { api } from '../../../../../convex/_generated/api';

@Component({
  selector: 'app-designations',
  standalone: true,
  imports: [CommonModule, UiDataTableComponent, UiButtonComponent, UiModalComponent, UiIconComponent, DynamicFormComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold text-stone-900">Designations</h2>
          <p class="mt-1 text-stone-500">Manage employee designations and levels.</p>
        </div>
        <ui-button (onClick)="openCreateModal()">
          <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
          Add Designation
        </ui-button>
      </div>

      <div class="bg-white rounded-2xl shadow-lg shadow-stone-200/50 border border-stone-200 overflow-hidden">
        <ui-data-table
          [data]="designations()"
          [columns]="columns"
          [loading]="loading()"
          [actionsTemplate]="actionsRef"
        ></ui-data-table>
      </div>

      <ng-template #actionsRef let-row>
        <div class="flex gap-2 justify-end">
          <button
            class="p-1.5 text-stone-400 hover:text-[#8b1e3f] hover:bg-[#fdf2f4] rounded-lg transition-colors"
            (click)="openEditModal(row)"
            title="Edit"
          >
            <ui-icon name="pencil" class="w-4 h-4"></ui-icon>
          </button>
          <button
            class="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            (click)="deleteDesignation(row)"
            title="Delete"
          >
            <ui-icon name="trash" class="w-4 h-4"></ui-icon>
          </button>
        </div>
      </ng-template>

      <ui-modal
        [(isOpen)]="showModal"
        [title]="isEditing() ? 'Edit Designation' : 'Add Designation'"
      >
        <app-dynamic-form
          [fields]="formConfig"
          [initialValues]="currentDesignation() || {}"
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
export class DesignationsComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);

  designations = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);

  showModal = signal(false);
  isEditing = signal(false);
  currentDesignation = signal<any>(null);

  private unsubscribe: (() => void) | null = null;

  columns: TableColumn[] = [
    { key: 'title', header: 'Title', sortable: true },
    { key: 'code', header: 'Code', sortable: true },
    { key: 'level', header: 'Level', sortable: true },
    { key: 'description', header: 'Description' }
  ];

  formConfig: FieldConfig[] = [
    { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Senior Software Engineer' },
    { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. SSE' },
    { name: 'level', label: 'Level', type: 'number', placeholder: 'e.g. 3' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' }
  ];

  ngOnInit() {
    const client = this.convexService.getClient();
    this.unsubscribe = client.onUpdate(api.organization.listDesignations, {}, (data) => {
      this.designations.set(data);
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
    this.currentDesignation.set(null);
    this.showModal.set(true);
  }

  openEditModal(row: any) {
    this.isEditing.set(true);
    this.currentDesignation.set(row);
    this.showModal.set(true);
  }

  async onSubmit(formData: any) {
    this.submitting.set(true);
    const client = this.convexService.getClient();

    try {
      if (this.isEditing()) {
        const id = this.currentDesignation()._id;
        await client.mutation(api.organization.updateDesignation, {
          id,
          title: formData.title,
          code: formData.code,
          level: formData.level ? Number(formData.level) : undefined,
          description: formData.description
        });
      } else {
        await client.mutation(api.organization.createDesignation, {
          title: formData.title,
          code: formData.code,
          level: formData.level ? Number(formData.level) : undefined,
          description: formData.description
        });
      }
      this.showModal.set(false);
    } catch (error) {
      console.error('Error saving designation:', error);
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteDesignation(row: any) {
    if (!confirm('Are you sure you want to delete this designation?')) return;

    try {
      const client = this.convexService.getClient();
      await client.mutation(api.organization.deleteDesignation, { id: row._id });
    } catch (error) {
      console.error('Error deleting designation:', error);
    }
  }
}
