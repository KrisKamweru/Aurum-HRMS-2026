import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
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
  selector: 'app-transfers',
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
          <h1 class="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">Transfers</h1>
          <p class="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Manage employee department and location transfers.</p>
        </div>
        <ui-button
          (onClick)="openCreateModal()"
          [prerequisitesMet]="departments().length > 1 && employees().length > 0"
          prerequisiteMessage="You need employees and at least 2 Departments to perform a transfer."
          [prerequisiteAction]="{ label: 'Manage Departments', link: ['/organization/departments'] }"
        >
          <ui-icon name="arrow-right-left" class="w-4 h-4 mr-2"></ui-icon>
          Transfer Employee
        </ui-button>
      </div>

      <ui-data-table
        cornerStyle="square"
        [data]="enrichedTransfers()"
        [columns]="columns"
        [loading]="loading()"
      ></ui-data-table>

      <ui-modal
        [(isOpen)]="showModal"
        title="Transfer Employee"
      >
        <form [formGroup]="transferForm" (ngSubmit)="onSubmit()" class="space-y-4">

          <!-- Employee Selection -->
          <ui-form-field
            label="Employee"
            [control]="transferForm.get('employeeId')"
            id="employeeId"
            [required]="true"
          >
            <select
              id="employeeId"
              formControlName="employeeId"
              class="block w-full rounded-xl border-stone-200 dark:border-white/8 shadow-sm focus:border-burgundy-700 focus:ring-burgundy-700 sm:text-sm px-3 py-2 border bg-stone-50/50 dark:bg-white/5"
              (change)="onEmployeeChange()"
            >
              <option value="">Select Employee</option>
              @for (emp of employees(); track emp._id) {
                <option [value]="emp._id">{{ emp.firstName }} {{ emp.lastName }}</option>
              }
            </select>
          </ui-form-field>

          @if (selectedEmployee()) {
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-stone-50 dark:bg-white/5 rounded-lg border border-stone-200 dark:border-white/8 text-sm">
              <div>
                <span class="text-stone-500 dark:text-stone-400 block">Current Department</span>
                <span class="font-medium text-stone-900 dark:text-white">{{ selectedEmployee()?.department || 'N/A' }}</span>
                <input type="hidden" formControlName="fromDepartmentId">
              </div>
              <div>
                <span class="text-stone-500 dark:text-stone-400 block">Current Location</span>
                <span class="font-medium text-stone-900 dark:text-white">{{ selectedEmployee()?.location || 'N/A' }}</span>
                <input type="hidden" formControlName="fromLocationId">
              </div>
            </div>
          }

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- To Department -->
            <ui-form-field
              label="New Department"
              [control]="transferForm.get('toDepartmentId')"
              id="toDepartmentId"
              [required]="true"
            >
              <select
                id="toDepartmentId"
                formControlName="toDepartmentId"
                class="block w-full rounded-xl border-stone-200 dark:border-white/8 shadow-sm focus:border-burgundy-700 focus:ring-burgundy-700 sm:text-sm px-3 py-2 border bg-stone-50/50 dark:bg-white/5"
              >
                <option value="">Select Department</option>
                @for (dept of departments(); track dept._id) {
                  <option [value]="dept._id">{{ dept.name }}</option>
                }
              </select>
            </ui-form-field>

            <!-- To Location -->
            <ui-form-field
              label="New Location"
              [control]="transferForm.get('toLocationId')"
              id="toLocationId"
              hint="Optional"
            >
              <select
                id="toLocationId"
                formControlName="toLocationId"
                class="block w-full rounded-xl border-stone-200 dark:border-white/8 shadow-sm focus:border-burgundy-700 focus:ring-burgundy-700 sm:text-sm px-3 py-2 border bg-stone-50/50 dark:bg-white/5"
              >
                <option value="">Select Location</option>
                @for (loc of locations(); track loc._id) {
                  <option [value]="loc._id">{{ loc.name }}</option>
                }
              </select>
            </ui-form-field>
          </div>

          <!-- Transfer Date -->
          <ui-form-field
            label="Transfer Date"
            [control]="transferForm.get('transferDate')"
            id="transferDate"
            [required]="true"
          >
            <input
              type="date"
              id="transferDate"
              formControlName="transferDate"
              class="block w-full rounded-xl border-stone-200 dark:border-white/8 shadow-sm focus:border-burgundy-700 focus:ring-burgundy-700 sm:text-sm px-3 py-2 border bg-stone-50/50 dark:bg-white/5"
            />
          </ui-form-field>

          <!-- Remarks -->
          <ui-form-field
            label="Remarks"
            [control]="transferForm.get('remarks')"
            id="remarks"
          >
            <textarea
              id="remarks"
              formControlName="remarks"
              rows="3"
              class="block w-full rounded-xl border-stone-200 dark:border-white/8 shadow-sm focus:border-burgundy-700 focus:ring-burgundy-700 sm:text-sm px-3 py-2 border bg-stone-50/50 dark:bg-white/5"
            ></textarea>
          </ui-form-field>

          <div class="flex justify-end gap-3 pt-4 border-t border-stone-100 dark:border-white/8">
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
              [disabled]="transferForm.invalid || submitting()"
            >
              Transfer
            </ui-button>
          </div>
        </form>
      </ui-modal>
    </div>
  `
})
export class TransfersComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  transfers = signal<any[]>([]);
  employees = signal<any[]>([]);
  departments = signal<any[]>([]);
  locations = signal<any[]>([]);

  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);

  selectedEmployee = signal<any>(null);
  transferForm: FormGroup;

  // Computed signal to enrich transfers with names
  enrichedTransfers = computed(() => {
    const list = this.transfers();
    const emps = this.employees();
    const depts = this.departments();
    const locs = this.locations();

    if (emps.length === 0 || depts.length === 0) return list;

    return list.map(t => {
      const emp = emps.find(e => e._id === t.employeeId);
      const fromDept = depts.find(d => d._id === t.fromDepartmentId);
      const toDept = depts.find(d => d._id === t.toDepartmentId);
      const fromLoc = locs.find(l => l._id === t.fromLocationId);
      const toLoc = locs.find(l => l._id === t.toLocationId);

      return {
        ...t,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
        fromDepartment: fromDept ? fromDept.name : 'Unknown',
        toDepartment: toDept ? toDept.name : 'Unknown',
        fromLocation: fromLoc ? fromLoc.name : (t.fromLocationId ? 'Unknown' : '-'),
        toLocation: toLoc ? toLoc.name : (t.toLocationId ? 'Unknown' : '-')
      };
    });
  });

  columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'fromDepartment', header: 'From Dept', sortable: true },
    { key: 'toDepartment', header: 'To Dept', sortable: true },
    { key: 'fromLocation', header: 'From Loc', sortable: true },
    { key: 'toLocation', header: 'To Loc', sortable: true },
    { key: 'transferDate', header: 'Date', type: 'date', sortable: true }
  ];

  private unsubTransfers: (() => void) | null = null;
  private unsubEmployees: (() => void) | null = null;
  private unsubDepartments: (() => void) | null = null;
  private unsubLocations: (() => void) | null = null;

  constructor() {
    this.transferForm = this.fb.group({
      employeeId: ['', Validators.required],
      fromDepartmentId: ['', Validators.required],
      toDepartmentId: ['', Validators.required],
      fromLocationId: [null],
      toLocationId: [null],
      transferDate: [new Date().toISOString().split('T')[0], Validators.required],
      remarks: ['']
    });
  }

  ngOnInit() {
    const client = this.convexService.getClient();

    this.unsubTransfers = client.onUpdate(api.core_hr.getTransfers, {}, (data) => {
      this.transfers.set(data);
      this.loading.set(false);
    });

    this.unsubEmployees = client.onUpdate(api.employees.list, {}, (data) => {
      this.employees.set(data);
    });

    this.unsubDepartments = client.onUpdate(api.organization.listDepartments, {}, (data) => {
      this.departments.set(data);
    });

    this.unsubLocations = client.onUpdate(api.organization.listLocations, {}, (data) => {
      this.locations.set(data);
    });
  }

  ngOnDestroy() {
    if (this.unsubTransfers) this.unsubTransfers();
    if (this.unsubEmployees) this.unsubEmployees();
    if (this.unsubDepartments) this.unsubDepartments();
    if (this.unsubLocations) this.unsubLocations();
  }

  onEmployeeChange() {
    const empId = this.transferForm.get('employeeId')?.value;
    if (!empId) {
      this.selectedEmployee.set(null);
      this.transferForm.patchValue({
        fromDepartmentId: '',
        fromLocationId: null
      });
      return;
    }

    const emp = this.employees().find(e => e._id === empId);
    if (emp) {
      this.selectedEmployee.set(emp);

      if (emp.departmentId) {
        this.transferForm.patchValue({ fromDepartmentId: emp.departmentId });
      } else {
        this.toastService.warning('Selected employee is not assigned to a department.');
        this.transferForm.patchValue({ fromDepartmentId: '' });
      }

      this.transferForm.patchValue({ fromLocationId: emp.locationId || null });
    }
  }

  openCreateModal() {
    this.transferForm.reset({
      transferDate: new Date().toISOString().split('T')[0]
    });
    this.selectedEmployee.set(null);
    this.showModal.set(true);
  }

  async onSubmit() {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const client = this.convexService.getClient();
    const formValue = this.transferForm.value;

    try {
      await client.mutation(api.core_hr.createTransfer, {
        employeeId: formValue.employeeId,
        fromDepartmentId: formValue.fromDepartmentId,
        toDepartmentId: formValue.toDepartmentId,
        fromLocationId: formValue.fromLocationId || undefined,
        toLocationId: formValue.toLocationId || undefined,
        transferDate: formValue.transferDate,
        remarks: formValue.remarks || undefined
      });

      this.toastService.success('Transfer recorded successfully');
      this.showModal.set(false);
    } catch (error: any) {
      console.error('Error recording transfer:', error);
      this.toastService.error(error.message || 'Failed to record transfer');
    } finally {
      this.submitting.set(false);
    }
  }
}
