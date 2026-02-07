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
  selector: 'app-warnings',
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
          <h1 class="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">Warnings</h1>
          <p class="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Manage disciplinary warnings and actions.</p>
        </div>
        <ui-button
          (onClick)="openCreateModal()"
          [prerequisitesMet]="employees().length > 0"
          prerequisiteMessage="You need to add employees before you can issue a warning."
          [prerequisiteAction]="{ label: 'Add Employee', link: ['/employees'] }"
        >
          <ui-icon name="alert-triangle" class="w-4 h-4 mr-2"></ui-icon>
          Issue Warning
        </ui-button>
      </div>

      <ui-data-table
        [data]="enrichedWarnings()"
        [columns]="columns"
        [loading]="loading()"
      ></ui-data-table>

      <ui-modal
        [(isOpen)]="showModal"
        title="Issue Warning"
      >
        <app-dynamic-form
          [fields]="formConfig"
          [initialValues]="initialFormValues"
          [loading]="submitting()"
          submitLabel="Issue Warning"
          (formSubmit)="onSubmit($event)"
          (cancel)="showModal.set(false)"
          [showCancel]="true"
        ></app-dynamic-form>
      </ui-modal>
    </div>
  `
})
export class WarningsComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);
  private toastService = inject(ToastService);

  warnings = signal<any[]>([]);
  employees = signal<any[]>([]);

  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);

  initialFormValues: any = {};

  // Computed signal to enrich warnings with names
  enrichedWarnings = computed(() => {
    const list = this.warnings();
    const emps = this.employees();

    if (emps.length === 0) return list;

    return list.map(w => {
      const emp = emps.find(e => e._id === w.employeeId);
      return {
        ...w,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown'
      };
    });
  });

  columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'subject', header: 'Subject', sortable: true },
    {
      key: 'severity',
      header: 'Severity',
      type: 'badge',
      badgeVariant: (value) => {
        switch (value) {
          case 'low': return 'neutral';
          case 'medium': return 'warning';
          case 'high': return 'danger';
          case 'critical': return 'danger'; // Assuming danger is appropriate for critical too, or add custom style
          default: return 'neutral';
        }
      }
    },
    { key: 'issueDate', header: 'Date', type: 'date', sortable: true }
  ];

  formConfig: FieldConfig[] = [
    {
      name: 'employeeId',
      label: 'Employee',
      type: 'select',
      required: true,
      options: []
    },
    { name: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'e.g. Late Arrival' },
    {
      name: 'severity',
      label: 'Severity',
      type: 'select',
      required: true,
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' }
      ]
    },
    { name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    { name: 'actionTaken', label: 'Action Taken', type: 'textarea', hint: 'Optional' }
  ];

  private unsubWarnings: (() => void) | null = null;
  private unsubEmployees: (() => void) | null = null;

  ngOnInit() {
    const client = this.convexService.getClient();

    this.unsubWarnings = client.onUpdate(api.core_hr.getWarnings, {}, (data) => {
      this.warnings.set(data);
      this.loading.set(false);
    });

    this.unsubEmployees = client.onUpdate(api.employees.list, {}, (data) => {
      this.employees.set(data);
      this.updateEmployeeOptions(data);
    });
  }

  ngOnDestroy() {
    if (this.unsubWarnings) this.unsubWarnings();
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
      issueDate: new Date().toISOString().split('T')[0],
      severity: 'low'
    };
    this.showModal.set(true);
  }

  async onSubmit(formData: any) {
    this.submitting.set(true);
    const client = this.convexService.getClient();

    try {
      await client.mutation(api.core_hr.issueWarning, {
        employeeId: formData.employeeId,
        subject: formData.subject,
        description: formData.description,
        severity: formData.severity,
        issueDate: formData.issueDate,
        actionTaken: formData.actionTaken || undefined
      });

      this.toastService.success('Warning issued successfully');
      this.showModal.set(false);
    } catch (error: any) {
      console.error('Error issuing warning:', error);
      this.toastService.error(error.message || 'Failed to issue warning');
    } finally {
      this.submitting.set(false);
    }
  }
}
