import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { LeaveRequestStatus, RebuildLeaveRequest } from '../data/leave-requests-rebuild.models';
import { LeaveRequestsRebuildStore } from '../data/leave-requests-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-leave-requests-rebuild',
  imports: [DatePipe, UiBadgeComponent, UiButtonComponent, UiModalComponent, DynamicFormComponent, UiConfirmDialogComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Leave Requests</h1>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Submit, review, and action leave workflows with parity-safe status controls.
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <ui-badge variant="warning" size="sm" [rounded]="true">Pending {{ pendingRequestCount() }}</ui-badge>
            <ui-badge variant="success" size="sm" [rounded]="true">Approved {{ approvedRequestCount() }}</ui-badge>
            <ui-badge variant="neutral" size="sm" [rounded]="true">Total {{ requests().length }}</ui-badge>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <ui-button variant="secondary" size="sm" [disabled]="isLoading()" (onClick)="refresh()">Refresh</ui-button>
          <ui-button variant="primary" size="sm" [disabled]="isSaving()" (onClick)="openCreateModal()">New Request</ui-button>
        </div>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" [disabled]="isLoading()" (onClick)="refresh()">Retry</ui-button>
        </section>
      }

      @if (isLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-4 w-36 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-28 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else if (requests().length === 0) {
        <section class="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <p class="text-lg font-semibold text-stone-800 dark:text-stone-100">No leave requests yet</p>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">Create your first request to begin the workflow.</p>
          <ui-button class="mt-4" variant="primary" size="sm" (onClick)="openCreateModal()">New Request</ui-button>
        </section>
      } @else {
        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-[#eeedf0] text-xs font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.02] dark:text-stone-400">
                <tr>
                  <th class="px-4 py-3">Employee</th>
                  <th class="px-4 py-3">Type</th>
                  <th class="px-4 py-3">Range</th>
                  <th class="px-4 py-3">Days</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (request of requests(); track request.id) {
                  <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                    <td class="px-4 py-3">
                      <p class="font-semibold text-stone-800 dark:text-stone-100">{{ request.employeeName }}</p>
                      <p class="text-xs text-stone-500 dark:text-stone-400">{{ request.employeeDepartment }}</p>
                    </td>
                    <td class="px-4 py-3 text-stone-700 capitalize dark:text-stone-300">{{ request.type }}</td>
                    <td class="px-4 py-3 text-stone-600 dark:text-stone-300">
                      {{ request.startDate | date: 'MMM d, y' }} - {{ request.endDate | date: 'MMM d, y' }}
                    </td>
                    <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ request.days }}</td>
                    <td class="px-4 py-3">
                      <ui-badge size="sm" [rounded]="true" [variant]="statusVariant(request.status)">{{ request.status }}</ui-badge>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex justify-end gap-2">
                        @if (request.status === 'pending' && canManage()) {
                          <ui-button size="sm" variant="secondary" [disabled]="isSaving()" (onClick)="requestStatusChange(request.id, 'approved')">Approve</ui-button>
                          <ui-button size="sm" variant="danger" [disabled]="isSaving()" (onClick)="requestStatusChange(request.id, 'rejected')">Reject</ui-button>
                        }
                        @if (request.status === 'pending' && (canManage() || isOwnRequest(request))) {
                          <ui-button size="sm" variant="outline" [disabled]="isSaving()" (onClick)="requestStatusChange(request.id, 'cancelled')">Cancel</ui-button>
                        }
                      </div>
                    </td>
                  </tr>
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
        width="normal"
        title="Create Leave Request"
      >
        <app-dynamic-form
          container="modal"
          [fields]="leaveFields"
          [sections]="leaveSections"
          [steps]="leaveSteps"
          [initialValues]="createInitialValues()"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Submit Request"
          (cancel)="closeCreateModal()"
          (formSubmit)="createRequestFromForm($event)"
        />
      </ui-modal>

      <ui-confirm-dialog
        [isOpen]="isStatusDialogOpen()"
        (isOpenChange)="isStatusDialogOpen.set($event)"
        [options]="statusDialogOptions()"
        (confirm)="confirmStatusUpdate($event)"
      />
    </main>
  `
})
export class LeaveRequestsRebuildComponent implements OnInit {
  private readonly store = inject(LeaveRequestsRebuildStore);

  readonly requests = this.store.requests;
  readonly viewer = this.store.viewer;
  readonly isLoading = this.store.isLoading;
  readonly isSaving = this.store.isSaving;
  readonly error = this.store.error;
  readonly canManage = this.store.canManage;
  readonly pendingRequestCount = this.store.pendingRequestCount;
  readonly approvedRequestCount = this.store.approvedRequestCount;
  readonly employeeOptions = this.store.employeeOptions;

  readonly isCreateModalOpen = signal(false);
  readonly createInitialValues = signal<Record<string, unknown>>({});
  readonly isStatusDialogOpen = signal(false);
  readonly pendingStatusId = signal<string | null>(null);
  readonly pendingStatus = signal<Exclude<LeaveRequestStatus, 'pending'> | null>(null);

  readonly leaveSections: FormSectionConfig[] = [
    {
      id: 'request',
      title: 'Request Details',
      description: 'Type and date range',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'notes',
      title: 'Context',
      description: 'Optional supporting reason',
      columns: { base: 1, md: 2, lg: 2 }
    }
  ];

  readonly leaveSteps: FormStepConfig[] = [
    { id: 'leave-step-1', title: 'Details', sectionIds: ['request'] },
    { id: 'leave-step-2', title: 'Context', sectionIds: ['notes'] }
  ];

  readonly statusDialogOptions = computed<ConfirmDialogOptions>(() => {
    const status = this.pendingStatus();
    if (status === 'approved') {
      return {
        title: 'Approve Request',
        message: 'Approve this leave request now?',
        confirmText: 'Approve',
        cancelText: 'Cancel',
        variant: 'warning'
      };
    }
    if (status === 'rejected') {
      return {
        title: 'Reject Request',
        message: 'Reject this leave request and notify the employee.',
        confirmText: 'Reject',
        cancelText: 'Cancel',
        variant: 'danger',
        reasonRequired: true,
        reasonLabel: 'Rejection reason',
        reasonPlaceholder: 'Provide a concise reason'
      };
    }
    return {
      title: 'Cancel Request',
      message: 'Cancel this leave request?',
      confirmText: 'Cancel Request',
      cancelText: 'Keep',
      variant: 'warning'
    };
  });

  get leaveFields(): FieldConfig[] {
    const fields: FieldConfig[] = [
      {
        name: 'leaveType',
        label: 'Leave Type',
        type: 'select',
        sectionId: 'request',
        required: true,
        options: [
          { label: 'Vacation', value: 'vacation' },
          { label: 'Sick', value: 'sick' },
          { label: 'Personal', value: 'personal' },
          { label: 'Maternity', value: 'maternity' },
          { label: 'Paternity', value: 'paternity' }
        ]
      },
      {
        name: 'startDate',
        label: 'Start Date',
        type: 'date',
        sectionId: 'request',
        required: true
      },
      {
        name: 'endDate',
        label: 'End Date',
        type: 'date',
        sectionId: 'request',
        required: true
      },
      {
        name: 'reason',
        label: 'Reason',
        type: 'textarea',
        sectionId: 'notes',
        required: false,
        colSpan: 2
      }
    ];

    if (this.canManage()) {
      fields.unshift({
        name: 'employeeId',
        label: 'Employee',
        type: 'select',
        sectionId: 'request',
        required: true,
        options: this.employeeOptions().map((employee) => ({
          label: employee.meta ? `${employee.label} (${employee.meta})` : employee.label,
          value: employee.id
        }))
      });
    }
    return fields;
  }

  ngOnInit(): void {
    void this.store.loadInitial();
  }

  refresh(): void {
    void this.store.loadInitial();
  }

  openCreateModal(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.createInitialValues.set({
      leaveType: 'vacation',
      startDate: today,
      endDate: today
    });
    this.isCreateModalOpen.set(true);
    this.store.clearError();
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  async createRequestFromForm(payload: Record<string, unknown>): Promise<void> {
    const success = await this.store.createRequest({
      employeeId: this.readText(payload, 'employeeId'),
      type: this.readText(payload, 'leaveType'),
      startDate: this.readText(payload, 'startDate'),
      endDate: this.readText(payload, 'endDate'),
      reason: this.readText(payload, 'reason')
    });
    if (success) {
      this.closeCreateModal();
    }
  }

  requestStatusChange(id: string, status: Exclude<LeaveRequestStatus, 'pending'>): void {
    this.pendingStatusId.set(id);
    this.pendingStatus.set(status);
    this.isStatusDialogOpen.set(true);
    this.store.clearError();
  }

  async confirmStatusUpdate(reason: string): Promise<void> {
    const id = this.pendingStatusId();
    const status = this.pendingStatus();
    if (!id || !status) {
      return;
    }
    const success = await this.store.updateRequestStatus({
      id,
      status,
      rejectionReason: status === 'rejected' ? reason.trim() : undefined
    });
    if (success) {
      this.pendingStatusId.set(null);
      this.pendingStatus.set(null);
      this.isStatusDialogOpen.set(false);
    }
  }

  isOwnRequest(request: RebuildLeaveRequest): boolean {
    return this.viewer().employeeId === request.employeeId;
  }

  statusVariant(status: LeaveRequestStatus): BadgeVariant {
    if (status === 'approved') {
      return 'success';
    }
    if (status === 'pending') {
      return 'warning';
    }
    if (status === 'rejected') {
      return 'danger';
    }
    return 'neutral';
  }

  private readText(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];
    return typeof value === 'string' ? value : '';
  }
}
