import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  selector: 'app-awards',
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
          <h1 class="heading-accent">Awards</h1>
          <p class="mt-3 text-stone-500">Recognize and reward employee achievements.</p>
        </div>
        <ui-button
          (onClick)="openCreateModal()"
          [prerequisitesMet]="employees().length > 0"
          prerequisiteMessage="You need to add employees before you can give an award."
          [prerequisiteAction]="{ label: 'Add Employee', link: ['/employees'] }"
        >
          <ui-icon name="award" class="w-4 h-4 mr-2"></ui-icon>
          Give Award
        </ui-button>
      </div>

      <ui-data-table
        [data]="enrichedAwards()"
        [columns]="columns"
        [loading]="loading()"
      ></ui-data-table>

      <ui-modal
        [(isOpen)]="showModal"
        title="Give Award"
      >
        <app-dynamic-form
          [fields]="formConfig"
          [initialValues]="initialFormValues"
          [loading]="submitting()"
          submitLabel="Award"
          (formSubmit)="onSubmit($event)"
          (cancel)="showModal.set(false)"
          [showCancel]="true"
        ></app-dynamic-form>
      </ui-modal>
    </div>
  `
})
export class AwardsComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);
  private toastService = inject(ToastService);

  awards = signal<any[]>([]);
  employees = signal<any[]>([]);

  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);

  initialFormValues: any = {};

  // Computed signal to enrich awards with names
  enrichedAwards = computed(() => {
    const awds = this.awards();
    const emps = this.employees();

    if (emps.length === 0) return awds;

    return awds.map(a => {
      const emp = emps.find(e => e._id === a.employeeId);
      return {
        ...a,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown'
      };
    });
  });

  columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'title', header: 'Title', sortable: true },
    { key: 'date', header: 'Date', type: 'date', sortable: true },
    { key: 'gift', header: 'Gift', sortable: true },
    { key: 'cashPrice', header: 'Cash Prize', type: 'currency', sortable: true }
  ];

  formConfig: FieldConfig[] = [
    {
      name: 'employeeId',
      label: 'Employee',
      type: 'select',
      required: true,
      options: []
    },
    { name: 'title', label: 'Award Title', type: 'text', required: true, placeholder: 'e.g. Employee of the Month' },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'gift', label: 'Gift', type: 'text', hint: 'Optional' },
    { name: 'cashPrice', label: 'Cash Prize', type: 'number', hint: 'Optional' },
    { name: 'description', label: 'Description/Reason', type: 'textarea' }
  ];

  private unsubAwards: (() => void) | null = null;
  private unsubEmployees: (() => void) | null = null;

  ngOnInit() {
    const client = this.convexService.getClient();

    this.unsubAwards = client.onUpdate(api.core_hr.getAwards, {}, (data) => {
      this.awards.set(data);
      this.loading.set(false);
    });

    this.unsubEmployees = client.onUpdate(api.employees.list, {}, (data) => {
      this.employees.set(data);
      this.updateEmployeeOptions(data);
    });
  }

  ngOnDestroy() {
    if (this.unsubAwards) this.unsubAwards();
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
      date: new Date().toISOString().split('T')[0]
    };
    this.showModal.set(true);
  }

  async onSubmit(formData: any) {
    this.submitting.set(true);
    const client = this.convexService.getClient();

    try {
      await client.mutation(api.core_hr.giveAward, {
        employeeId: formData.employeeId,
        title: formData.title,
        date: formData.date,
        gift: formData.gift || undefined,
        cashPrice: formData.cashPrice || undefined,
        description: formData.description || undefined
      });

      this.toastService.success('Award given successfully');
      this.showModal.set(false);
    } catch (error: any) {
      console.error('Error giving award:', error);
      this.toastService.error(error.message || 'Failed to give award');
    } finally {
      this.submitting.set(false);
    }
  }
}
