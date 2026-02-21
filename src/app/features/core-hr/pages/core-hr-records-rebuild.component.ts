import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { ModalWidth, UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { CoreHrRecordType, ResignationDecision } from '../data/core-hr-rebuild.models';
import { CoreHrRebuildStore } from '../data/core-hr-rebuild.store';

interface CoreHrColumn {
  key: string;
  label: string;
  kind: 'text' | 'date' | 'currency' | 'badge';
}

interface CoreHrPageConfig {
  title: string;
  description: string;
  createLabel: string;
  createTitle: string;
  modalWidth: ModalWidth;
  columns: CoreHrColumn[];
}

const CORE_HR_PAGE_CONFIG: Record<CoreHrRecordType, CoreHrPageConfig> = {
  promotions: {
    title: 'Promotions',
    description: 'Track role advancements and compensation progression.',
    createLabel: 'Promote Employee',
    createTitle: 'Create Promotion',
    modalWidth: 'normal',
    columns: [
      { key: 'employeeId', label: 'Employee', kind: 'text' },
      { key: 'fromDesignationId', label: 'From', kind: 'text' },
      { key: 'toDesignationId', label: 'To', kind: 'text' },
      { key: 'promotionDate', label: 'Date', kind: 'date' },
      { key: 'salaryIncrement', label: 'Increment', kind: 'currency' }
    ]
  },
  transfers: {
    title: 'Transfers',
    description: 'Track employee department and location changes.',
    createLabel: 'Transfer Employee',
    createTitle: 'Create Transfer',
    modalWidth: 'normal',
    columns: [
      { key: 'employeeId', label: 'Employee', kind: 'text' },
      { key: 'fromDepartmentId', label: 'From Dept', kind: 'text' },
      { key: 'toDepartmentId', label: 'To Dept', kind: 'text' },
      { key: 'fromLocationId', label: 'From Loc', kind: 'text' },
      { key: 'toLocationId', label: 'To Loc', kind: 'text' },
      { key: 'transferDate', label: 'Date', kind: 'date' }
    ]
  },
  awards: {
    title: 'Awards',
    description: 'Capture recognition events and discretionary awards.',
    createLabel: 'Give Award',
    createTitle: 'Create Award',
    modalWidth: 'normal',
    columns: [
      { key: 'employeeId', label: 'Employee', kind: 'text' },
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'date', label: 'Date', kind: 'date' },
      { key: 'gift', label: 'Gift', kind: 'text' },
      { key: 'cashPrice', label: 'Cash Prize', kind: 'currency' }
    ]
  },
  warnings: {
    title: 'Warnings',
    description: 'Capture disciplinary warnings and associated severity.',
    createLabel: 'Issue Warning',
    createTitle: 'Create Warning',
    modalWidth: 'normal',
    columns: [
      { key: 'employeeId', label: 'Employee', kind: 'text' },
      { key: 'subject', label: 'Subject', kind: 'text' },
      { key: 'severity', label: 'Severity', kind: 'badge' },
      { key: 'issueDate', label: 'Issue Date', kind: 'date' }
    ]
  },
  resignations: {
    title: 'Resignations',
    description: 'Manage notice periods and HR approval decisions.',
    createLabel: 'Submit Resignation',
    createTitle: 'Create Resignation',
    modalWidth: 'normal',
    columns: [
      { key: 'employeeId', label: 'Employee', kind: 'text' },
      { key: 'noticeDate', label: 'Notice Date', kind: 'date' },
      { key: 'lastWorkingDay', label: 'Last Working Day', kind: 'date' },
      { key: 'status', label: 'Status', kind: 'badge' }
    ]
  },
  terminations: {
    title: 'Terminations',
    description: 'Record final separation and offboarding decisions.',
    createLabel: 'Terminate Employee',
    createTitle: 'Create Termination',
    modalWidth: 'normal',
    columns: [
      { key: 'employeeId', label: 'Employee', kind: 'text' },
      { key: 'terminationDate', label: 'Date', kind: 'date' },
      { key: 'type', label: 'Type', kind: 'badge' },
      { key: 'noticeGiven', label: 'Notice', kind: 'text' }
    ]
  },
  complaints: {
    title: 'Complaints',
    description: 'Capture grievance intake and employee relations cases.',
    createLabel: 'File Complaint',
    createTitle: 'Create Complaint',
    modalWidth: 'wide',
    columns: [
      { key: 'complainantId', label: 'Complainant', kind: 'text' },
      { key: 'accusedId', label: 'Accused', kind: 'text' },
      { key: 'subject', label: 'Subject', kind: 'text' },
      { key: 'date', label: 'Date', kind: 'date' },
      { key: 'status', label: 'Status', kind: 'badge' }
    ]
  },
  travel: {
    title: 'Travel Requests',
    description: 'Track business travel requests, schedules, and budgets.',
    createLabel: 'Create Travel Request',
    createTitle: 'Create Travel Request',
    modalWidth: 'wide',
    columns: [
      { key: 'employeeId', label: 'Employee', kind: 'text' },
      { key: 'destination', label: 'Destination', kind: 'text' },
      { key: 'startDate', label: 'Start Date', kind: 'date' },
      { key: 'endDate', label: 'End Date', kind: 'date' },
      { key: 'budget', label: 'Budget', kind: 'currency' },
      { key: 'status', label: 'Status', kind: 'badge' }
    ]
  }
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-core-hr-records-rebuild',
  imports: [DatePipe, CurrencyPipe, UiBadgeComponent, UiButtonComponent, UiModalComponent, DynamicFormComponent, UiConfirmDialogComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">{{ page().title }}</h1>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">{{ page().description }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <ui-button variant="secondary" size="sm" [disabled]="isLoading()" (onClick)="refresh()">Refresh</ui-button>
          <ui-button variant="primary" size="sm" [disabled]="!canCreate() || isSaving()" (onClick)="openCreateModal()">
            {{ page().createLabel }}
          </ui-button>
        </div>
      </section>

      @if (!canCreate()) {
        <section class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700/30 dark:bg-amber-900/20 dark:text-amber-300">
          {{ prerequisitesMessage() }}
        </section>
      }

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" [disabled]="isLoading()" (onClick)="refresh()">Retry</ui-button>
        </section>
      }

      @if (isLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-4 w-40 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-28 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else {
        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-white/8">
            <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Records</p>
            <ui-badge variant="neutral" size="sm" [rounded]="true">Total {{ records().length }}</ui-badge>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-[#eeedf0] text-xs font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.02] dark:text-stone-400">
                <tr>
                  @for (column of page().columns; track column.key) {
                    <th class="px-4 py-3">{{ column.label }}</th>
                  }
                  @if (recordType() === 'resignations') {
                    <th class="px-4 py-3 text-right">Actions</th>
                  }
                </tr>
              </thead>
              <tbody>
                @if (records().length === 0) {
                  <tr>
                    <td [attr.colspan]="page().columns.length + (recordType() === 'resignations' ? 1 : 0)" class="px-4 py-5 text-center text-stone-500 dark:text-stone-400">
                      No records yet.
                    </td>
                  </tr>
                } @else {
                  @for (row of records(); track readText(row, 'id')) {
                    <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                      @for (column of page().columns; track column.key) {
                        <td class="px-4 py-3 text-stone-700 dark:text-stone-300">
                          @switch (column.kind) {
                            @case ('badge') {
                              <ui-badge size="sm" [rounded]="true" [variant]="badgeVariant(column.key, readCell(row, column.key))">
                                {{ badgeLabel(column.key, readCell(row, column.key)) }}
                              </ui-badge>
                            }
                            @case ('date') {
                              {{ formatDate(readCell(row, column.key)) | date: 'MMM d, y' }}
                            }
                            @case ('currency') {
                              {{ formatCurrency(readCell(row, column.key)) | currency }}
                            }
                            @default {
                              {{ formatText(row, column.key) }}
                            }
                          }
                        </td>
                      }

                      @if (recordType() === 'resignations') {
                        <td class="px-4 py-3">
                          @if (readText(row, 'status') === 'pending') {
                            <div class="flex justify-end gap-2">
                              <ui-button size="sm" variant="outline" [disabled]="!canManage() || isSaving()" (onClick)="requestResignationDecision(readText(row, 'id'), 'rejected')">
                                Reject
                              </ui-button>
                              <ui-button size="sm" variant="primary" [disabled]="!canManage() || isSaving()" (onClick)="requestResignationDecision(readText(row, 'id'), 'approved')">
                                Approve
                              </ui-button>
                            </div>
                          }
                        </td>
                      }
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      <ui-modal
        [isOpen]="isCreateModalOpen()"
        (isOpenChange)="isCreateModalOpen.set($event)"
        [canDismiss]="true"
        [hasFooter]="false"
        [width]="page().modalWidth"
        [title]="page().createTitle"
      >
        <app-dynamic-form
          container="modal"
          [fields]="formFields()"
          [sections]="formSections()"
          [steps]="formSteps()"
          [initialValues]="initialValues()"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Save"
          (cancel)="closeCreateModal()"
          (formSubmit)="submitFromForm($event)"
        />
      </ui-modal>

      <ui-confirm-dialog
        [isOpen]="isDecisionDialogOpen()"
        (isOpenChange)="isDecisionDialogOpen.set($event)"
        [options]="decisionDialogOptions()"
        (confirm)="confirmResignationDecision()"
      />
    </main>
  `
})
export class CoreHrRecordsRebuildComponent implements OnInit {
  private readonly store = inject(CoreHrRebuildStore);
  private readonly route = inject(ActivatedRoute);

  readonly recordType = signal<CoreHrRecordType>('promotions');
  readonly isCreateModalOpen = signal(false);
  readonly initialValues = signal<Record<string, unknown>>({});
  readonly isDecisionDialogOpen = signal(false);
  readonly pendingDecision = signal<ResignationDecision | null>(null);
  readonly pendingResignationId = signal<string | null>(null);

  readonly isLoading = this.store.isLoading;
  readonly isSaving = this.store.isSaving;
  readonly error = this.store.error;
  readonly canManage = this.store.canManage;
  readonly employees = this.store.employees;
  readonly departments = this.store.departments;
  readonly designations = this.store.designations;
  readonly locations = this.store.locations;

  readonly page = computed(() => CORE_HR_PAGE_CONFIG[this.recordType()]);
  readonly records = computed(() => this.store.records()[this.recordType()]);

  readonly decisionDialogOptions = computed<ConfirmDialogOptions>(() => {
    if (this.pendingDecision() === 'rejected') {
      return {
        title: 'Reject Resignation',
        message: 'Reject this resignation request and keep the employee active?',
        confirmText: 'Reject',
        cancelText: 'Cancel',
        variant: 'danger'
      };
    }
    return {
      title: 'Approve Resignation',
      message: 'Approve this resignation request and mark it as accepted?',
      confirmText: 'Approve',
      cancelText: 'Cancel',
      variant: 'warning'
    };
  });

  ngOnInit(): void {
    this.recordType.set(this.resolveRecordType(this.route.snapshot.data['recordType']));
    this.refresh();
  }

  refresh(): void {
    void this.store.loadRecordType(this.recordType());
  }

  canCreate(): boolean {
    if (this.recordType() === 'promotions') {
      return this.employees().length > 0 && this.designations().length > 1;
    }
    if (this.recordType() === 'transfers') {
      return this.employees().length > 0 && this.departments().length > 1;
    }
    return this.employees().length > 0;
  }

  prerequisitesMessage(): string {
    if (this.recordType() === 'promotions') {
      return 'You need employees and at least two designations before creating promotions.';
    }
    if (this.recordType() === 'transfers') {
      return 'You need employees and at least two departments before creating transfers.';
    }
    return 'You need employees before creating records in this module.';
  }

  openCreateModal(): void {
    this.initialValues.set(this.defaultFormValues(this.recordType()));
    this.isCreateModalOpen.set(true);
    this.store.clearError();
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  async submitFromForm(payload: Record<string, unknown>): Promise<void> {
    const success = await this.store.submitRecord(this.recordType(), payload);
    if (success) {
      this.closeCreateModal();
    }
  }

  requestResignationDecision(id: string, decision: ResignationDecision): void {
    this.pendingResignationId.set(id);
    this.pendingDecision.set(decision);
    this.isDecisionDialogOpen.set(true);
    this.store.clearError();
  }

  async confirmResignationDecision(): Promise<void> {
    const resignationId = this.pendingResignationId();
    const decision = this.pendingDecision();
    if (!resignationId || !decision) {
      return;
    }

    const success = await this.store.reviewResignation(resignationId, decision);
    if (success) {
      this.pendingResignationId.set(null);
      this.pendingDecision.set(null);
      this.isDecisionDialogOpen.set(false);
    }
  }

  formSections(): FormSectionConfig[] {
    return [
      {
        id: 'people',
        title: 'People',
        description: 'Select employee details for this lifecycle event.',
        columns: { base: 1, md: 2, lg: 2 }
      },
      {
        id: 'details',
        title: 'Details',
        description: 'Provide event-specific dates and context.',
        columns: { base: 1, md: 2, lg: 2 }
      }
    ];
  }

  formSteps(): FormStepConfig[] {
    return [
      { id: 'step-people', title: 'People', sectionIds: ['people'] },
      { id: 'step-details', title: 'Details', sectionIds: ['details'] }
    ];
  }

  formFields(): FieldConfig[] {
    const type = this.recordType();
    const employeeOptions = this.employees().map((employee) => ({
      label: employee.status ? `${employee.fullName} (${employee.status})` : employee.fullName,
      value: employee.id
    }));

    if (type === 'promotions') {
      return [
        { name: 'employeeId', label: 'Employee', type: 'select', sectionId: 'people', required: true, options: employeeOptions },
        {
          name: 'toDesignationId',
          label: 'Target Designation',
          type: 'select',
          sectionId: 'people',
          required: true,
          options: this.designations().map((designation) => ({ label: designation.label, value: designation.id }))
        },
        { name: 'promotionDate', label: 'Promotion Date', type: 'date', sectionId: 'details', required: true },
        { name: 'salaryIncrement', label: 'Salary Increment', type: 'number', sectionId: 'details', required: false, placeholder: '0.00' },
        { name: 'remarks', label: 'Remarks', type: 'textarea', sectionId: 'details', required: false, colSpan: 2 }
      ];
    }

    if (type === 'transfers') {
      return [
        { name: 'employeeId', label: 'Employee', type: 'select', sectionId: 'people', required: true, options: employeeOptions },
        {
          name: 'toDepartmentId',
          label: 'Target Department',
          type: 'select',
          sectionId: 'people',
          required: true,
          options: this.departments().map((department) => ({ label: department.label, value: department.id }))
        },
        {
          name: 'toLocationId',
          label: 'Target Location',
          type: 'select',
          sectionId: 'people',
          required: false,
          options: this.locations().map((location) => ({ label: location.label, value: location.id }))
        },
        { name: 'transferDate', label: 'Transfer Date', type: 'date', sectionId: 'details', required: true },
        { name: 'remarks', label: 'Remarks', type: 'textarea', sectionId: 'details', required: false, colSpan: 2 }
      ];
    }

    if (type === 'awards') {
      return [
        { name: 'employeeId', label: 'Employee', type: 'select', sectionId: 'people', required: true, options: employeeOptions },
        { name: 'title', label: 'Award Title', type: 'text', sectionId: 'details', required: true },
        { name: 'date', label: 'Award Date', type: 'date', sectionId: 'details', required: true },
        { name: 'gift', label: 'Gift', type: 'text', sectionId: 'details', required: false },
        { name: 'cashPrice', label: 'Cash Prize', type: 'number', sectionId: 'details', required: false },
        { name: 'description', label: 'Description', type: 'textarea', sectionId: 'details', required: false, colSpan: 2 }
      ];
    }

    if (type === 'warnings') {
      return [
        { name: 'employeeId', label: 'Employee', type: 'select', sectionId: 'people', required: true, options: employeeOptions },
        { name: 'subject', label: 'Subject', type: 'text', sectionId: 'details', required: true },
        {
          name: 'severity',
          label: 'Severity',
          type: 'select',
          sectionId: 'details',
          required: true,
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
            { label: 'Critical', value: 'critical' }
          ]
        },
        { name: 'issueDate', label: 'Issue Date', type: 'date', sectionId: 'details', required: true },
        { name: 'description', label: 'Description', type: 'textarea', sectionId: 'details', required: true, colSpan: 2 },
        { name: 'actionTaken', label: 'Action Taken', type: 'textarea', sectionId: 'details', required: false, colSpan: 2 }
      ];
    }

    if (type === 'resignations') {
      return [
        { name: 'employeeId', label: 'Employee', type: 'select', sectionId: 'people', required: true, options: employeeOptions },
        { name: 'noticeDate', label: 'Notice Date', type: 'date', sectionId: 'details', required: true },
        { name: 'lastWorkingDay', label: 'Last Working Day', type: 'date', sectionId: 'details', required: true },
        { name: 'reason', label: 'Reason', type: 'textarea', sectionId: 'details', required: true, colSpan: 2 }
      ];
    }

    if (type === 'terminations') {
      return [
        {
          name: 'employeeId',
          label: 'Employee',
          type: 'select',
          sectionId: 'people',
          required: true,
          options: employeeOptions.filter((option) => {
            const employee = this.employees().find((row) => row.id === option.value);
            return employee?.status.trim().toLowerCase() !== 'terminated';
          })
        },
        { name: 'terminationDate', label: 'Termination Date', type: 'date', sectionId: 'details', required: true },
        {
          name: 'type',
          label: 'Termination Type',
          type: 'select',
          sectionId: 'details',
          required: true,
          options: [
            { label: 'Voluntary', value: 'voluntary' },
            { label: 'Involuntary', value: 'involuntary' }
          ]
        },
        { name: 'reason', label: 'Reason', type: 'textarea', sectionId: 'details', required: true, colSpan: 2 },
        { name: 'noticeGiven', label: 'Notice Given', type: 'checkbox', sectionId: 'details', required: false, hint: 'Notice period served or provided.' }
      ];
    }

    if (type === 'complaints') {
      return [
        { name: 'complainantId', label: 'Complainant', type: 'select', sectionId: 'people', required: true, options: employeeOptions },
        { name: 'accusedId', label: 'Accused', type: 'select', sectionId: 'people', required: false, options: employeeOptions },
        { name: 'subject', label: 'Subject', type: 'text', sectionId: 'details', required: true, colSpan: 2 },
        { name: 'date', label: 'Incident Date', type: 'date', sectionId: 'details', required: true },
        { name: 'description', label: 'Description', type: 'textarea', sectionId: 'details', required: true, colSpan: 2 }
      ];
    }

    return [
      { name: 'employeeId', label: 'Employee', type: 'select', sectionId: 'people', required: true, options: employeeOptions },
      { name: 'destination', label: 'Destination', type: 'text', sectionId: 'details', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', sectionId: 'details', required: true },
      { name: 'endDate', label: 'End Date', type: 'date', sectionId: 'details', required: true },
      { name: 'budget', label: 'Budget', type: 'number', sectionId: 'details', required: false },
      { name: 'purpose', label: 'Purpose', type: 'textarea', sectionId: 'details', required: true, colSpan: 2 }
    ];
  }

  readCell(row: unknown, key: string): unknown {
    if (!row || typeof row !== 'object') {
      return '';
    }
    const record = row as Record<string, unknown>;
    return record[key];
  }

  readText(row: unknown, key: string): string {
    const value = this.readCell(row, key);
    return typeof value === 'string' ? value : '';
  }

  formatText(row: unknown, key: string): string {
    if (key === 'employeeId' || key === 'complainantId' || key === 'accusedId') {
      const employeeId = this.readText(row, key);
      if (!employeeId) {
        return '-';
      }
      return this.employeeName(employeeId);
    }
    if (key === 'fromDesignationId' || key === 'toDesignationId') {
      const designationId = this.readText(row, key);
      return designationId ? this.designationLabel(designationId) : '-';
    }
    if (key === 'fromDepartmentId' || key === 'toDepartmentId') {
      const departmentId = this.readText(row, key);
      return departmentId ? this.departmentLabel(departmentId) : '-';
    }
    if (key === 'fromLocationId' || key === 'toLocationId') {
      const locationId = this.readText(row, key);
      return locationId ? this.locationLabel(locationId) : '-';
    }
    if (key === 'noticeGiven') {
      return this.readCell(row, key) === true ? 'Yes' : 'No';
    }
    const value = this.readCell(row, key);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    return '-';
  }

  formatDate(value: unknown): string | null {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return null;
    }
    return value;
  }

  formatCurrency(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return 0;
  }

  badgeLabel(_key: string, value: unknown): string {
    if (typeof value !== 'string') {
      return 'unknown';
    }
    return value;
  }

  badgeVariant(key: string, value: unknown): BadgeVariant {
    if (typeof value !== 'string') {
      return 'neutral';
    }
    const normalized = value.trim().toLowerCase();
    if (key === 'severity') {
      if (normalized === 'critical' || normalized === 'high') {
        return 'danger';
      }
      if (normalized === 'medium') {
        return 'warning';
      }
      return 'neutral';
    }
    if (key === 'type') {
      return normalized === 'voluntary' ? 'success' : 'danger';
    }
    if (key === 'status') {
      if (normalized === 'approved' || normalized === 'resolved') {
        return 'success';
      }
      if (normalized === 'rejected' || normalized === 'dismissed') {
        return 'danger';
      }
      return 'warning';
    }
    return 'neutral';
  }

  private employeeName(id: string): string {
    const employee = this.employees().find((row) => row.id === id);
    return employee?.fullName ?? 'Unknown Employee';
  }

  private designationLabel(id: string): string {
    const designation = this.designations().find((row) => row.id === id);
    return designation?.label ?? 'Unknown Designation';
  }

  private departmentLabel(id: string): string {
    const department = this.departments().find((row) => row.id === id);
    return department?.label ?? 'Unknown Department';
  }

  private locationLabel(id: string): string {
    const location = this.locations().find((row) => row.id === id);
    return location?.label ?? 'Unknown Location';
  }

  private resolveRecordType(value: unknown): CoreHrRecordType {
    if (
      value === 'promotions' ||
      value === 'transfers' ||
      value === 'awards' ||
      value === 'warnings' ||
      value === 'resignations' ||
      value === 'terminations' ||
      value === 'complaints' ||
      value === 'travel'
    ) {
      return value;
    }
    return 'promotions';
  }

  private defaultFormValues(type: CoreHrRecordType): Record<string, unknown> {
    const today = new Date().toISOString().slice(0, 10);
    if (type === 'promotions') {
      return { promotionDate: today };
    }
    if (type === 'transfers') {
      return { transferDate: today };
    }
    if (type === 'awards') {
      return { date: today };
    }
    if (type === 'warnings') {
      return { issueDate: today, severity: 'low' };
    }
    if (type === 'resignations') {
      return { noticeDate: today, lastWorkingDay: today };
    }
    if (type === 'terminations') {
      return { terminationDate: today, type: 'involuntary', noticeGiven: false };
    }
    if (type === 'complaints') {
      return { date: today };
    }
    return { startDate: today, endDate: today };
  }
}
