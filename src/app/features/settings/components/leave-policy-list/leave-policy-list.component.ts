import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { UiDataTableComponent, TableColumn } from '../../../../shared/components/ui-data-table/ui-data-table.component';
import { UiModalComponent } from '../../../../shared/components/ui-modal/ui-modal.component';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../../../shared/services/form-helper.service';
import { UiGridComponent } from '../../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../../shared/components/ui-grid/ui-grid-tile.component';
import { ConvexClientService } from '../../../../core/services/convex-client.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { api } from '../../../../../../convex/_generated/api';

@Component({
  selector: 'app-leave-policy-list',
  standalone: true,
  imports: [
    CommonModule,
    UiButtonComponent,
    UiIconComponent,
    UiDataTableComponent,
    UiModalComponent,
    DynamicFormComponent,
    UiGridComponent,
    UiGridTileComponent
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-stone-900 dark:text-white">Leave Policies</h2>
          <p class="text-stone-500 dark:text-stone-400 text-sm">Configure leave types and entitlements for your organization.</p>
        </div>
        <div class="flex gap-2">
          <ui-button variant="outline" (onClick)="seedDefaults()" [loading]="seeding()">
            <ui-icon name="arrow-path" class="w-4 h-4 mr-2"></ui-icon>
            Reset Defaults
          </ui-button>
          <ui-button (onClick)="openCreateModal()">
            <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
            Add Policy
          </ui-button>
        </div>
      </div>

      <div class="dash-frame">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="Leave Policies" variant="compact">
            <div class="tile-body">
              <ui-data-table
                cornerStyle="square"
                [data]="policies()"
                [columns]="columns"
                [loading]="loading()"
                [actionsTemplate]="actionsRef"
                headerVariant="plain"
              ></ui-data-table>
            </div>
          </ui-grid-tile>
        </ui-grid>
      </div>

      <ng-template #actionsRef let-row>
        <div class="flex gap-2 justify-end">
          <button
            class="p-1.5 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 rounded-lg transition-colors"
            (click)="openEditModal(row)"
            title="Edit"
          >
            <ui-icon name="pencil" class="w-4 h-4"></ui-icon>
          </button>
          <button
            class="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            (click)="deletePolicy(row)"
            title="Delete"
          >
            <ui-icon name="trash" class="w-4 h-4"></ui-icon>
          </button>
        </div>
      </ng-template>

      <!-- Modal -->
      <ui-modal
        [(isOpen)]="showModal"
        [title]="isEditing() ? 'Edit Leave Policy' : 'New Leave Policy'"
      >
        <app-dynamic-form
          [fields]="formConfig"
          [initialValues]="currentPolicy() || {}"
          [loading]="submitting()"
          [submitLabel]="isEditing() ? 'Update Policy' : 'Create Policy'"
          (formSubmit)="onSubmit($event)"
          (cancel)="showModal.set(false)"
          [showCancel]="true"
        ></app-dynamic-form>
      </ui-modal>
    </div>
  `
})
export class LeavePolicyListComponent implements OnInit {
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  policies = signal<any[]>([]);
  loading = signal(true);
  seeding = signal(false);
  submitting = signal(false);

  showModal = signal(false);
  isEditing = signal(false);
  currentPolicy = signal<any>(null);

  columns: TableColumn[] = [
    { key: 'name', header: 'Policy Name', sortable: true },
    { key: 'code', header: 'Code', sortable: true },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'daysPerYear', header: 'Days/Year', sortable: true },
    { key: 'accrualFrequency', header: 'Accrual', sortable: true },
    {
      key: 'isActive',
      header: 'Status',
      type: 'badge',
      badgeVariant: (val) => val ? 'success' : 'neutral'
    }
  ];

  formConfig: FieldConfig[] = [
    { name: 'name', label: 'Policy Name', type: 'text', required: true, placeholder: 'e.g. Annual Vacation' },
    { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. AL' },
    {
      name: 'type',
      label: 'Leave Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Vacation', value: 'vacation' },
        { label: 'Sick Leave', value: 'sick' },
        { label: 'Personal Leave', value: 'personal' },
        { label: 'Maternity Leave', value: 'maternity' },
        { label: 'Paternity Leave', value: 'paternity' },
        { label: 'Other', value: 'other' }
      ]
    },
    { name: 'daysPerYear', label: 'Days Per Year', type: 'number', required: true },
    {
      name: 'accrualFrequency',
      label: 'Accrual Frequency',
      type: 'select',
      required: true,
      options: [
        { label: 'Annual (All at once)', value: 'annual' },
        { label: 'Monthly (Pro-rated)', value: 'monthly' }
      ]
    },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'isActive', label: 'Active', type: 'checkbox' }
  ];

  ngOnInit() {
    const client = this.convex.getClient();
    client.onUpdate(api.settings.listLeavePolicies, {}, (data) => {
      // Map boolean isActive to string for badge if needed, or handle in component
      // UiDataTable handles boolean in badgeVariant logic if we adapt it?
      // Actually my DataTable badgeVariant logic expects strings usually.
      // Let's rely on custom badge logic in DataTable or transform here?
      // The badgeVariant function receives the value. true/false.
      // I'll update badgeVariant in columns to handle boolean.
      this.policies.set(data || []);
      this.loading.set(false);
    });
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.currentPolicy.set({ isActive: true, accrualFrequency: 'annual' });
    this.showModal.set(true);
  }

  openEditModal(row: any) {
    this.isEditing.set(true);
    this.currentPolicy.set(row);
    this.showModal.set(true);
  }

  async onSubmit(data: any) {
    this.submitting.set(true);
    try {
      if (this.isEditing()) {
        await this.convex.getClient().mutation(api.settings.updateLeavePolicy, {
          id: this.currentPolicy()._id,
          updates: {
            name: data.name,
            daysPerYear: Number(data.daysPerYear),
            accrualFrequency: data.accrualFrequency,
            description: data.description,
            isActive: data.isActive
          }
        });
        this.toast.success('Policy updated');
      } else {
        await this.convex.getClient().mutation(api.settings.createLeavePolicy, {
          ...data,
          daysPerYear: Number(data.daysPerYear)
        });
        this.toast.success('Policy created');
      }
      this.showModal.set(false);
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to save policy');
    } finally {
      this.submitting.set(false);
    }
  }

  async deletePolicy(row: any) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Leave Policy',
      message: `Are you sure you want to delete the policy "${row.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await this.convex.getClient().mutation(api.settings.deleteLeavePolicy, { id: row._id });
      this.toast.success('Policy deleted');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to delete policy');
    }
  }

  async seedDefaults() {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Reset to Default Policies',
      message: 'This will create default leave policies if they don\'t exist. Do you want to continue?',
      confirmText: 'Reset',
      cancelText: 'Cancel',
      variant: 'warning'
    });

    if (!confirmed) return;

    this.seeding.set(true);
    try {
      await this.convex.getClient().mutation(api.settings.seedDefaultPolicies, {});
      this.toast.success('Default policies added');
    } catch (err: any) {
      this.toast.error('Failed to seed defaults');
    } finally {
      this.seeding.set(false);
    }
  }
}

