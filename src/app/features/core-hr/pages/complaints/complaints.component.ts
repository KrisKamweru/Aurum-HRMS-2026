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
  selector: 'app-complaints',
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
          <h1 class="heading-accent">Complaints</h1>
          <p class="mt-3 text-stone-500">Manage workplace complaints and grievances.</p>
        </div>
        <ui-button
          (onClick)="openCreateModal()"
          [prerequisitesMet]="employees().length > 0"
          prerequisiteMessage="You need to add employees before you can file a complaint."
          [prerequisiteAction]="{ label: 'Add Employee', link: ['/employees'] }"
        >
          <ui-icon name="message-square-warning" class="w-4 h-4 mr-2"></ui-icon>
          File Complaint
        </ui-button>
      </div>

      <ui-data-table
        [data]="enrichedComplaints()"
        [columns]="columns"
        [loading]="loading()"
      ></ui-data-table>

      <ui-modal
        [(isOpen)]="showModal"
        title="File Complaint"
      >
        <app-dynamic-form
          [fields]="formConfig"
          [initialValues]="initialFormValues"
          [loading]="submitting()"
          submitLabel="Submit Complaint"
          (formSubmit)="onSubmit($event)"
          (cancel)="showModal.set(false)"
          [showCancel]="true"
        ></app-dynamic-form>
      </ui-modal>
    </div>
  `
})
export class ComplaintsComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);
  private toastService = inject(ToastService);

  complaints = signal<any[]>([]);
  employees = signal<any[]>([]);

  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);

  initialFormValues: any = {};

  // Computed signal to enrich complaints with names
  enrichedComplaints = computed(() => {
    const list = this.complaints();
    const emps = this.employees();

    if (emps.length === 0) return list;

    return list.map(c => {
      const complainant = emps.find(e => e._id === c.complainantId);
      const accused = c.accusedId ? emps.find(e => e._id === c.accusedId) : null;

      return {
        ...c,
        complainantName: complainant ? `${complainant.firstName} ${complainant.lastName}` : 'Unknown',
        accusedName: accused ? `${accused.firstName} ${accused.lastName}` : (c.accusedId ? 'Unknown' : '-'),
      };
    });
  });

  columns: TableColumn[] = [
    { key: 'complainantName', header: 'Complainant', sortable: true },
    { key: 'accusedName', header: 'Accused', sortable: true },
    { key: 'subject', header: 'Subject', sortable: true },
    { key: 'date', header: 'Date', type: 'date', sortable: true },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      badgeVariant: (val) => val === 'resolved' ? 'success' : (val === 'pending' ? 'warning' : 'neutral')
    }
  ];

  formConfig: FieldConfig[] = [
    {
      name: 'complainantId',
      label: 'Complainant (Employee)',
      type: 'select',
      required: true,
      options: []
    },
    {
      name: 'accusedId',
      label: 'Accused Employee',
      type: 'select',
      hint: 'Optional - leave blank if not applicable',
      options: []
    },
    { name: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'e.g. Harassment, Unfair Treatment' },
    { name: 'date', label: 'Date of Incident', type: 'date', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true }
  ];

  private unsubComplaints: (() => void) | null = null;
  private unsubEmployees: (() => void) | null = null;

  ngOnInit() {
    const client = this.convexService.getClient();

    this.unsubComplaints = client.onUpdate(api.core_hr.getComplaints, {}, (data) => {
      this.complaints.set(data);
      this.loading.set(false);
    });

    this.unsubEmployees = client.onUpdate(api.employees.list, {}, (data) => {
      this.employees.set(data);
      this.updateEmployeeOptions(data);
    });
  }

  ngOnDestroy() {
    if (this.unsubComplaints) this.unsubComplaints();
    if (this.unsubEmployees) this.unsubEmployees();
  }

  updateEmployeeOptions(employees: any[]) {
    const options = employees.map(e => ({
      label: `${e.firstName} ${e.lastName}`,
      value: e._id
    }));

    this.formConfig = this.formConfig.map(field => {
      if (field.name === 'complainantId' || field.name === 'accusedId') {
        return { ...field, options };
      }
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
      await client.mutation(api.core_hr.fileComplaint, {
        complainantId: formData.complainantId,
        accusedId: formData.accusedId || undefined,
        subject: formData.subject,
        description: formData.description,
        date: formData.date
      });

      this.toastService.success('Complaint filed successfully');
      this.showModal.set(false);
    } catch (error: any) {
      console.error('Error filing complaint:', error);
      this.toastService.error(error.message || 'Failed to file complaint');
    } finally {
      this.submitting.set(false);
    }
  }
}
