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
import { Id } from '../../../../../convex/_generated/dataModel';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, UiDataTableComponent, UiButtonComponent, UiModalComponent, UiIconComponent, DynamicFormComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold text-stone-900">Departments</h2>
          <p class="mt-1 text-stone-500">Manage organizational departments.</p>
        </div>
        <ui-button (onClick)="openCreateModal()">
          <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
          Add Department
        </ui-button>
      </div>

      <div class="bg-white rounded-2xl shadow-lg shadow-stone-200/50 border border-stone-200 overflow-hidden">
        <ui-data-table
          [data]="departments()"
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
            (click)="deleteDepartment(row)"
            title="Delete"
          >
            <ui-icon name="trash" class="w-4 h-4"></ui-icon>
          </button>
        </div>
      </ng-template>

      <ui-modal
        [(isOpen)]="showModal"
        [title]="isEditing() ? 'Edit Department' : 'Add Department'"
      >
        <app-dynamic-form
          [fields]="formConfig"
          [initialValues]="currentDepartment() || {}"
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
export class DepartmentsComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);

  departments = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);

  showModal = signal(false);
  isEditing = signal(false);
  currentDepartment = signal<any>(null);

  private unsubscribe: (() => void) | null = null;

  columns: TableColumn[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'code', header: 'Code', sortable: true },
    { key: 'description', header: 'Description' }
  ];

  formConfig: FieldConfig[] = [
    { name: 'name', label: 'Department Name', type: 'text', required: true, placeholder: 'e.g. Engineering' },
    { name: 'code', label: 'Department Code', type: 'text', required: true, placeholder: 'e.g. ENG' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' }
  ];

  ngOnInit() {
    const client = this.convexService.getClient();
    this.unsubscribe = client.onUpdate(api.organization.listDepartments, {}, (data) => {
      this.departments.set(data);
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
    this.currentDepartment.set(null);
    this.showModal.set(true);
  }

  openEditModal(row: any) {
    this.isEditing.set(true);
    this.currentDepartment.set(row);
    this.showModal.set(true);
  }

  async onSubmit(formData: any) {
    this.submitting.set(true);
    const client = this.convexService.getClient();

    try {
      if (this.isEditing()) {
        const originalRow = this.departments().find(d => d.code === this.currentDepartment().code); // Hacky find since I didn't store ID in currentDepartment properly?
        // Wait, openEditModal sets currentDepartment to a copy of fields. I need the ID.
        // Let's fix openEditModal to store the full row or at least the ID.
      }

      // Actually, let's fix the logic below
      if (this.isEditing()) {
        // Need to find the original ID.
        // Best approach: Store the whole row in currentDepartment, but pass sanitized values to dynamic form?
        // Dynamic form takes initialValues.
        // I will find the ID from the `departments` signal based on the current context or just store it.
        // Better: openEditModal(row) -> currentDepartment.set(row).
        const id = this.currentDepartment()._id;

        await client.mutation(api.organization.updateDepartment, {
          id,
          name: formData.name,
          code: formData.code,
          description: formData.description
        });
      } else {
        await client.mutation(api.organization.createDepartment, {
          name: formData.name,
          code: formData.code,
          description: formData.description
        });
      }
      this.showModal.set(false);
    } catch (error) {
      console.error('Error saving department:', error);
      // Ideally show toast here
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteDepartment(row: any) {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      const client = this.convexService.getClient();
      await client.mutation(api.organization.deleteDepartment, { id: row._id });
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  }
}
