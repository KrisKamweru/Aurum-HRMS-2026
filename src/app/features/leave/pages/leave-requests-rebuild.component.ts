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
  template: ''
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
