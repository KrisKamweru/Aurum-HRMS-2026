import { Component, signal, inject, OnInit, OnDestroy, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UiDataTableComponent, TableColumn } from '../../../../shared/components/ui-data-table/ui-data-table.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiModalComponent } from '../../../../shared/components/ui-modal/ui-modal.component';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { UiFormFieldComponent } from '../../../../shared/components/ui-form-field/ui-form-field.component';
import { ConvexClientService } from '../../../../core/services/convex-client.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { api } from '../../../../../../convex/_generated/api';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiDataTableComponent,
    UiButtonComponent,
    UiModalComponent,
    UiIconComponent,
    UiFormFieldComponent
  ],
  providers: [DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="heading-accent">Promotions</h1>
          <p class="mt-3 text-stone-500">Manage employee promotions and role changes.</p>
        </div>
        <ui-button
          (onClick)="openCreateModal()"
          [prerequisitesMet]="designations().length > 1"
          prerequisiteMessage="You need at least 2 Designations to promote an employee."
          [prerequisiteAction]="{ label: 'Manage Designations', link: ['/organization/designations'] }"
        >
          <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
          Promote Employee
        </ui-button>
      </div>

      <ui-data-table
        [data]="enrichedPromotions()"
        [columns]="columns"
        [loading]="loading()"
      ></ui-data-table>

      <ui-modal
        [(isOpen)]="showModal"
        title="Promote Employee"
      >
        <form [formGroup]="promotionForm" (ngSubmit)="onSubmit()" class="space-y-4">

          <!-- Employee Selection -->
          <ui-form-field
            label="Employee"
            [control]="promotionForm.get('employeeId')"
            id="employeeId"
            [required]="true"
          >
            <select
              id="employeeId"
              formControlName="employeeId"
              class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border bg-stone-50/50"
              (change)="onEmployeeChange()"
            >
              <option value="">Select Employee</option>
              @for (emp of employees(); track emp._id) {
                <option [value]="emp._id">{{ emp.firstName }} {{ emp.lastName }}</option>
              }
            </select>
          </ui-form-field>

          @if (selectedEmployee()) {
            <div class="p-3 bg-stone-50 rounded-lg border border-stone-200 text-sm">
              <span class="text-stone-500">Current Position: </span>
              <span class="font-medium text-stone-900">{{ selectedEmployee()?.position || 'N/A' }}</span>
              <input type="hidden" formControlName="fromDesignationId">
            </div>
          }

          <!-- To Designation -->
          <ui-form-field
            label="New Designation"
            [control]="promotionForm.get('toDesignationId')"
            id="toDesignationId"
            [required]="true"
          >
            <select
              id="toDesignationId"
              formControlName="toDesignationId"
              class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border bg-stone-50/50"
            >
              <option value="">Select New Designation</option>
              @for (des of designations(); track des._id) {
                <option [value]="des._id">{{ des.title }}</option>
              }
            </select>
          </ui-form-field>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Promotion Date -->
            <ui-form-field
              label="Promotion Date"
              [control]="promotionForm.get('promotionDate')"
              id="promotionDate"
              [required]="true"
            >
              <input
                type="date"
                id="promotionDate"
                formControlName="promotionDate"
                class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border bg-stone-50/50"
              />
            </ui-form-field>

            <!-- Salary Increment -->
            <ui-form-field
              label="Salary Increment"
              [control]="promotionForm.get('salaryIncrement')"
              id="salaryIncrement"
              hint="Optional"
            >
              <input
                type="number"
                id="salaryIncrement"
                formControlName="salaryIncrement"
                placeholder="0.00"
                class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border bg-stone-50/50"
              />
            </ui-form-field>
          </div>

          <!-- Remarks -->
          <ui-form-field
            label="Remarks"
            [control]="promotionForm.get('remarks')"
            id="remarks"
          >
            <textarea
              id="remarks"
              formControlName="remarks"
              rows="3"
              class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border bg-stone-50/50"
            ></textarea>
          </ui-form-field>

          <div class="flex justify-end gap-3 pt-4 border-t border-stone-100">
            <ui-button
              type="button"
              variant="ghost"
              (onClick)="showModal.set(false)"
              [disabled]="submitting()"
            >
              Cancel
            </ui-button>
            <ui-button
              type="submit"
              [loading]="submitting()"
              [disabled]="promotionForm.invalid || submitting()"
            >
              Promote
            </ui-button>
          </div>
        </form>
      </ui-modal>
    </div>
  `
})
export class PromotionsComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  promotions = signal<any[]>([]);
  employees = signal<any[]>([]);
  designations = signal<any[]>([]);

  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);

  selectedEmployee = signal<any>(null);

  promotionForm: FormGroup;

  // Computed signal to enrich promotions with names
  enrichedPromotions = computed(() => {
    const proms = this.promotions();
    const emps = this.employees();
    const desigs = this.designations();

    if (emps.length === 0 || desigs.length === 0) return proms;

    return proms.map(p => {
      const emp = emps.find(e => e._id === p.employeeId);
      const fromDes = desigs.find(d => d._id === p.fromDesignationId);
      const toDes = desigs.find(d => d._id === p.toDesignationId);

      return {
        ...p,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
        fromDesignation: fromDes ? fromDes.title : 'Unknown',
        toDesignation: toDes ? toDes.title : 'Unknown'
      };
    });
  });

  columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'fromDesignation', header: 'From', sortable: true },
    { key: 'toDesignation', header: 'To', sortable: true },
    { key: 'promotionDate', header: 'Date', type: 'date', sortable: true },
    { key: 'salaryIncrement', header: 'Increment', type: 'currency', sortable: true }
  ];

  private unsubPromotions: (() => void) | null = null;
  private unsubEmployees: (() => void) | null = null;
  private unsubDesignations: (() => void) | null = null;

  constructor() {
    this.promotionForm = this.fb.group({
      employeeId: ['', Validators.required],
      fromDesignationId: ['', Validators.required],
      toDesignationId: ['', Validators.required],
      promotionDate: [new Date().toISOString().split('T')[0], Validators.required],
      salaryIncrement: [null],
      remarks: ['']
    });
  }

  ngOnInit() {
    const client = this.convexService.getClient();

    this.unsubPromotions = client.onUpdate(api.core_hr.getPromotions, {}, (data) => {
      this.promotions.set(data);
      this.loading.set(false);
    });

    this.unsubEmployees = client.onUpdate(api.employees.list, {}, (data) => {
      this.employees.set(data);
    });

    this.unsubDesignations = client.onUpdate(api.organization.listDesignations, {}, (data) => {
      this.designations.set(data);
    });
  }

  ngOnDestroy() {
    if (this.unsubPromotions) this.unsubPromotions();
    if (this.unsubEmployees) this.unsubEmployees();
    if (this.unsubDesignations) this.unsubDesignations();
  }

  onEmployeeChange() {
    const empId = this.promotionForm.get('employeeId')?.value;
    if (!empId) {
      this.selectedEmployee.set(null);
      this.promotionForm.patchValue({ fromDesignationId: '' });
      return;
    }

    const emp = this.employees().find(e => e._id === empId);
    if (emp) {
      this.selectedEmployee.set(emp);
      // Pre-fill fromDesignationId
      // Note: emp.designationId is what we need.
      // If emp doesn't have a designationId, we might need to handle that.
      if (emp.designationId) {
        this.promotionForm.patchValue({ fromDesignationId: emp.designationId });
      } else {
        // Warning or handle employees without designation
        this.toastService.warning('Selected employee does not have a current designation.');
        this.promotionForm.patchValue({ fromDesignationId: '' });
      }
    }
  }

  openCreateModal() {
    this.promotionForm.reset({
      promotionDate: new Date().toISOString().split('T')[0]
    });
    this.selectedEmployee.set(null);
    this.showModal.set(true);
  }

  async onSubmit() {
    if (this.promotionForm.invalid) {
      this.promotionForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const client = this.convexService.getClient();
    const formValue = this.promotionForm.value;

    try {
      await client.mutation(api.core_hr.createPromotion, {
        employeeId: formValue.employeeId,
        fromDesignationId: formValue.fromDesignationId,
        toDesignationId: formValue.toDesignationId,
        promotionDate: formValue.promotionDate,
        salaryIncrement: formValue.salaryIncrement || undefined,
        remarks: formValue.remarks || undefined
      });

      this.toastService.success('Promotion recorded successfully');
      this.showModal.set(false);
    } catch (error: any) {
      console.error('Error recording promotion:', error);
      this.toastService.error(error.message || 'Failed to record promotion');
    } finally {
      this.submitting.set(false);
    }
  }
}
