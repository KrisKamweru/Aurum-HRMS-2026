import { Component, signal, inject, OnInit, OnDestroy, computed, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { UiDataTableComponent, TableColumn } from '../../../../shared/components/ui-data-table/ui-data-table.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiModalComponent } from '../../../../shared/components/ui-modal/ui-modal.component';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../../../shared/services/form-helper.service';
import { ConvexClientService } from '../../../../core/services/convex-client.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { api } from '../../../../../../convex/_generated/api';

@Component({
  selector: 'app-resignations',
  standalone: true,
  imports: [
    CommonModule,
    UiDataTableComponent,
    UiButtonComponent,
    UiModalComponent,
    UiIconComponent,
    DynamicFormComponent
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="heading-accent">Resignations</h1>
          <p class="mt-3 text-stone-500">Manage employee resignations and exit process.</p>
        </div>
        <ui-button (onClick)="openCreateModal()">
          <ui-icon name="file-minus" class="w-4 h-4 mr-2"></ui-icon>
          Submit Resignation
        </ui-button>
      </div>

      <ui-data-table
        [data]="enrichedResignations()"
        [columns]="columns"
        [loading]="loading()"
        [actionsTemplate]="actionsRef"
      ></ui-data-table>

      <ng-template #actionsRef let-row>
        @if (row.status === 'pending') {
          <div class="flex gap-2 justify-end">
            <button
              class="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              (click)="updateStatus(row, 'approved')"
              title="Approve"
            >
              <ui-icon name="check" class="w-4 h-4"></ui-icon>
            </button>
            <button
              class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              (click)="updateStatus(row, 'rejected')"
              title="Reject"
            >
              <ui-icon name="x-mark" class="w-4 h-4"></ui-icon>
            </button>
          </div>
        }
      </ng-template>

      <ui-modal
        [(isOpen)]="showModal"
        title="Submit Resignation"
      >
        <app-dynamic-form
          [fields]="formConfig"
          [initialValues]="initialFormValues"
          [loading]="submitting()"
          submitLabel="Submit"
          (formSubmit)="onSubmit($event)"
          (cancel)="showModal.set(false)"
          [showCancel]="true"
        ></app-dynamic-form>
      </ui-modal>
    </div>
  `
})
export class ResignationsComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);
  private toastService = inject(ToastService);

  @ViewChild('actionsRef') actionsRef!: TemplateRef<any>;

  resignations = signal<any[]>([]);
  employees = signal<any[]>([]);

  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);

  initialFormValues: any = {};

  // Computed signal to enrich resignations with names
  enrichedResignations = computed(() => {
    const list = this.resignations();
    const emps = this.employees();

    if (emps.length === 0) return list;

    return list.map(r => {
      const emp = emps.find(e => e._id === r.employeeId);
      return {
        ...r,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown'
      };
    });
  });

  columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'noticeDate', header: 'Notice Date', type: 'date', sortable: true },
    { key: 'lastWorkingDay', header: 'Last Working Day', type: 'date', sortable: true },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      badgeVariant: (value) => {
        switch (value) {
          case 'approved': return 'success';
          case 'rejected': return 'danger';
          case 'pending': return 'warning';
          default: return 'neutral';
        }
      }
    }
  ];

  formConfig: FieldConfig[] = [
    {
      name: 'employeeId',
      label: 'Employee',
      type: 'select',
      required: true,
      options: []
    },
    { name: 'noticeDate', label: 'Notice Date', type: 'date', required: true },
    { name: 'lastWorkingDay', label: 'Last Working Day', type: 'date', required: true },
    { name: 'reason', label: 'Reason', type: 'textarea', required: true }
  ];

  private unsubResignations: (() => void) | null = null;
  private unsubEmployees: (() => void) | null = null;

  ngOnInit() {
    const client = this.convexService.getClient();

    this.unsubResignations = client.onUpdate(api.core_hr.getResignations, {}, (data) => {
      this.resignations.set(data);
      this.loading.set(false);
    });

    this.unsubEmployees = client.onUpdate(api.employees.list, {}, (data) => {
      this.employees.set(data);
      this.updateEmployeeOptions(data);
    });
  }

  ngOnDestroy() {
    if (this.unsubResignations) this.unsubResignations();
    if (this.unsubEmployees) this.unsubEmployees();
  }

  updateEmployeeOptions(employees: any[]) {
    const options = employees.map(e => ({
      label: `${e.firstName} ${e.lastName}`,
      value: e._id
    }));

    this.formConfig = this.formConfig.map(field => {
      if (field.name === 'employeeId') return { ...field, options };
      return field;
    });
  }

  openCreateModal() {
    this.initialFormValues = {
      noticeDate: new Date().toISOString().split('T')[0]
    };
    this.showModal.set(true);
  }

  async onSubmit(formData: any) {
    this.submitting.set(true);
    const client = this.convexService.getClient();

    try {
      await client.mutation(api.core_hr.submitResignation, {
        employeeId: formData.employeeId,
        noticeDate: formData.noticeDate,
        lastWorkingDay: formData.lastWorkingDay,
        reason: formData.reason
      });

      this.toastService.success('Resignation submitted successfully');
      this.showModal.set(false);
    } catch (error: any) {
      console.error('Error submitting resignation:', error);
      this.toastService.error(error.message || 'Failed to submit resignation');
    } finally {
      this.submitting.set(false);
    }
  }

  async updateStatus(row: any, status: 'approved' | 'rejected') {
    if (!confirm(`Are you sure you want to ${status} this resignation?`)) return;

    const client = this.convexService.getClient();
    try {
      await client.mutation(api.core_hr.updateResignationStatus, {
        resignationId: row._id,
        status: status
      });
      this.toastService.success(`Resignation ${status} successfully`);
    } catch (error: any) {
      console.error('Error updating status:', error);
      this.toastService.error(error.message || 'Failed to update status');
    }
  }
}
