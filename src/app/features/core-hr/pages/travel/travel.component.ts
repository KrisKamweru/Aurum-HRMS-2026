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
  selector: 'app-travel',
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
          <h1 class="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">Travel Requests</h1>
          <p class="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Manage employee travel and business trips.</p>
        </div>
        <ui-button
          (onClick)="openCreateModal()"
          [prerequisitesMet]="employees().length > 0"
          prerequisiteMessage="You need to add employees before you can create a travel request."
          [prerequisiteAction]="{ label: 'Add Employee', link: ['/employees'] }"
        >
          <ui-icon name="plane" class="w-4 h-4 mr-2"></ui-icon>
          New Travel Request
        </ui-button>
      </div>

      <ui-data-table
        [data]="enrichedTravel()"
        [columns]="columns"
        [loading]="loading()"
      ></ui-data-table>

      <ui-modal
        [(isOpen)]="showModal"
        title="Create Travel Request"
      >
        <app-dynamic-form
          [fields]="formConfig"
          [initialValues]="initialFormValues"
          [loading]="submitting()"
          submitLabel="Create Request"
          (formSubmit)="onSubmit($event)"
          (cancel)="showModal.set(false)"
          [showCancel]="true"
        ></app-dynamic-form>
      </ui-modal>
    </div>
  `
})
export class TravelComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);
  private toastService = inject(ToastService);

  requests = signal<any[]>([]);
  employees = signal<any[]>([]);

  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);

  initialFormValues: any = {};

  // Computed signal to enrich requests with names
  enrichedTravel = computed(() => {
    const list = this.requests();
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
    { key: 'destination', header: 'Destination', sortable: true },
    { key: 'startDate', header: 'Start Date', type: 'date', sortable: true },
    { key: 'endDate', header: 'End Date', type: 'date', sortable: true },
    { key: 'budget', header: 'Budget', type: 'currency', sortable: true },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      badgeVariant: (val) => {
        switch(val) {
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
    { name: 'destination', label: 'Destination', type: 'text', required: true },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true },
    { name: 'endDate', label: 'End Date', type: 'date', required: true },
    { name: 'purpose', label: 'Purpose', type: 'textarea', required: true },
    { name: 'budget', label: 'Estimated Budget', type: 'number', hint: 'Optional' }
  ];

  private unsubTravel: (() => void) | null = null;
  private unsubEmployees: (() => void) | null = null;

  ngOnInit() {
    const client = this.convexService.getClient();

    this.unsubTravel = client.onUpdate(api.core_hr.getTravelRequests, {}, (data) => {
      this.requests.set(data);
      this.loading.set(false);
    });

    this.unsubEmployees = client.onUpdate(api.employees.list, {}, (data) => {
      this.employees.set(data);
      this.updateEmployeeOptions(data);
    });
  }

  ngOnDestroy() {
    if (this.unsubTravel) this.unsubTravel();
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
    const today = new Date().toISOString().split('T')[0];
    this.initialFormValues = {
      startDate: today,
      endDate: today
    };
    this.showModal.set(true);
  }

  async onSubmit(formData: any) {
    this.submitting.set(true);
    const client = this.convexService.getClient();

    try {
      await client.mutation(api.core_hr.createTravelRequest, {
        employeeId: formData.employeeId,
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        purpose: formData.purpose,
        budget: formData.budget || undefined
      });

      this.toastService.success('Travel request created successfully');
      this.showModal.set(false);
    } catch (error: any) {
      console.error('Error creating travel request:', error);
      this.toastService.error(error.message || 'Failed to create travel request');
    } finally {
      this.submitting.set(false);
    }
  }
}
