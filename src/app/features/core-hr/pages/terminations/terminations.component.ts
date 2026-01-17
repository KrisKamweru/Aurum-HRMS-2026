import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
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
  selector: 'app-terminations',
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
          <h1 class="heading-accent">Terminations</h1>
          <p class="mt-3 text-stone-500">Manage employee terminations and offboarding.</p>
        </div>
        <ui-button (onClick)="openCreateModal()" variant="danger">
          <ui-icon name="user-x" class="w-4 h-4 mr-2"></ui-icon>
          Terminate Employee
        </ui-button>
      </div>

      <ui-data-table
        [data]="enrichedTerminations()"
        [columns]="columns"
        [loading]="loading()"
      ></ui-data-table>

      <ui-modal
        [(isOpen)]="showModal"
        title="Terminate Employee"
      >
        <div class="bg-red-50 text-red-700 p-4 rounded-lg mb-4 text-sm flex items-start">
          <ui-icon name="alert-triangle" class="w-5 h-5 mr-2 flex-shrink-0"></ui-icon>
          <p>Warning: This action will mark the employee status as 'Terminated'. Ensure all offboarding procedures are followed.</p>
        </div>

        <app-dynamic-form
          [fields]="formConfig"
          [initialValues]="initialFormValues"
          [loading]="submitting()"
          submitLabel="Terminate"
          (formSubmit)="onSubmit($event)"
          (cancel)="showModal.set(false)"
          [showCancel]="true"
        ></app-dynamic-form>
      </ui-modal>
    </div>
  `
})
export class TerminationsComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);
  private toastService = inject(ToastService);

  terminations = signal<any[]>([]);
  employees = signal<any[]>([]);

  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);

  initialFormValues: any = {};

  // Computed signal to enrich terminations with names
  enrichedTerminations = computed(() => {
    const list = this.terminations();
    const emps = this.employees();

    if (emps.length === 0) return list;

    return list.map(t => {
      const emp = emps.find(e => e._id === t.employeeId);
      return {
        ...t,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown'
      };
    });
  });

  columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'terminationDate', header: 'Termination Date', type: 'date', sortable: true },
    {
      key: 'type',
      header: 'Type',
      type: 'badge',
      badgeVariant: (value) => {
        return value === 'voluntary' ? 'success' : 'danger';
      }
    },
    { key: 'noticeGiven', header: 'Notice Given', formatter: (val) => val ? 'Yes' : 'No' }
  ];

  formConfig: FieldConfig[] = [
    {
      name: 'employeeId',
      label: 'Employee',
      type: 'select',
      required: true,
      options: []
    },
    { name: 'terminationDate', label: 'Termination Date', type: 'date', required: true },
    {
      name: 'type',
      label: 'Termination Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Voluntary', value: 'voluntary' },
        { label: 'Involuntary', value: 'involuntary' }
      ]
    },
    { name: 'reason', label: 'Reason', type: 'textarea', required: true },
    { name: 'noticeGiven', label: 'Notice Period Served/Given', type: 'checkbox' }
  ];

  private unsubTerminations: (() => void) | null = null;
  private unsubEmployees: (() => void) | null = null;

  ngOnInit() {
    const client = this.convexService.getClient();

    this.unsubTerminations = client.onUpdate(api.core_hr.getTerminations, {}, (data) => {
      this.terminations.set(data);
      this.loading.set(false);
    });

    this.unsubEmployees = client.onUpdate(api.employees.list, {}, (data) => {
      this.employees.set(data);
      this.updateEmployeeOptions(data);
    });
  }

  ngOnDestroy() {
    if (this.unsubTerminations) this.unsubTerminations();
    if (this.unsubEmployees) this.unsubEmployees();
  }

  updateEmployeeOptions(employees: any[]) {
    // Filter out already terminated employees if creating new termination?
    // For now, list active employees or all.
    const options = employees
      .filter(e => e.status !== 'terminated')
      .map(e => ({
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
      terminationDate: new Date().toISOString().split('T')[0],
      type: 'voluntary',
      noticeGiven: true
    };
    this.showModal.set(true);
  }

  async onSubmit(formData: any) {
    if (!confirm('This action is irreversible and will mark the employee as terminated. Proceed?')) return;

    this.submitting.set(true);
    const client = this.convexService.getClient();

    try {
      await client.mutation(api.core_hr.terminateEmployee, {
        employeeId: formData.employeeId,
        terminationDate: formData.terminationDate,
        type: formData.type,
        reason: formData.reason,
        noticeGiven: formData.noticeGiven || false
      });

      this.toastService.success('Employee terminated successfully');
      this.showModal.set(false);
    } catch (error: any) {
      console.error('Error terminating employee:', error);
      this.toastService.error(error.message || 'Failed to terminate employee');
    } finally {
      this.submitting.set(false);
    }
  }
}
