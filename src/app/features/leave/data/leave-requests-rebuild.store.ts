import { Injectable, computed, inject, signal } from '@angular/core';
import {
  CreateLeaveRequestInput,
  LeaveRequestStatusMutationInput,
  LeaveRequestType,
  RebuildLeaveEmployeeOption,
  RebuildLeaveRequest,
  RebuildLeaveViewerContext
} from './leave-requests-rebuild.models';
import { LeaveRequestsRebuildDataService } from './leave-requests-rebuild.data.service';

interface LeaveDraft {
  employeeId?: string;
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class LeaveRequestsRebuildStore {
  private readonly data = inject(LeaveRequestsRebuildDataService);

  private readonly requestsState = signal<RebuildLeaveRequest[]>([]);
  private readonly employeeOptionsState = signal<RebuildLeaveEmployeeOption[]>([]);
  private readonly viewerState = signal<RebuildLeaveViewerContext>({ role: 'pending' });
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly requests = this.requestsState.asReadonly();
  readonly employeeOptions = this.employeeOptionsState.asReadonly();
  readonly viewer = this.viewerState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly isSaving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly canManage = computed(() => {
    const role = this.viewer().role;
    return role === 'super_admin' || role === 'admin' || role === 'hr_manager' || role === 'manager';
  });

  readonly pendingRequestCount = computed(() => this.requests().filter((request) => request.status === 'pending').length);
  readonly approvedRequestCount = computed(() => this.requests().filter((request) => request.status === 'approved').length);

  async loadInitial(): Promise<void> {
    this.loadingState.set(true);
    this.clearError();
    try {
      const viewer = await this.data.getViewerContext();
      this.viewerState.set(viewer);
      await this.loadRequests();
      if (this.canManage()) {
        this.employeeOptionsState.set(await this.data.listEmployeeOptions());
      } else {
        this.employeeOptionsState.set([]);
      }
    } catch (error: unknown) {
      this.setError(error, 'Unable to load leave requests.');
    } finally {
      this.loadingState.set(false);
    }
  }

  async createRequest(payload: LeaveDraft): Promise<boolean> {
    const normalized = this.normalizeDraft(payload);
    if (!normalized) {
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.createRequest(normalized);
      await this.loadRequests();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to submit leave request.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async updateRequestStatus(payload: LeaveRequestStatusMutationInput): Promise<boolean> {
    const request = this.requests().find((row) => row.id === payload.id);
    if (!request) {
      this.errorState.set('Leave request not found.');
      return false;
    }
    if (request.status !== 'pending') {
      this.errorState.set('Only pending requests can be updated.');
      return false;
    }
    if ((payload.status === 'approved' || payload.status === 'rejected') && !this.canManage()) {
      this.errorState.set('You do not have permission to approve or reject leave requests.');
      return false;
    }
    if (payload.status === 'cancelled' && !this.canManage() && request.employeeId !== this.viewer().employeeId) {
      this.errorState.set('You can only cancel your own leave requests.');
      return false;
    }
    if (payload.status === 'rejected' && !(payload.rejectionReason?.trim().length)) {
      this.errorState.set('Provide a rejection reason.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.updateStatus(payload);
      await this.loadRequests();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to update leave request.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private async loadRequests(): Promise<void> {
    this.requestsState.set(await this.data.listRequests());
  }

  private normalizeDraft(payload: LeaveDraft): CreateLeaveRequestInput | null {
    const type = this.normalizeType(payload.type);
    if (!type) {
      this.errorState.set('Leave type is required.');
      return null;
    }
    const startDate = payload.startDate.trim();
    const endDate = payload.endDate.trim();
    if (!startDate || !endDate) {
      this.errorState.set('Start date and end date are required.');
      return null;
    }

    const startMs = Date.parse(startDate);
    const endMs = Date.parse(endDate);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      this.errorState.set('Enter valid leave dates.');
      return null;
    }
    if (endMs < startMs) {
      this.errorState.set('End date must be on or after the start date.');
      return null;
    }

    const selectedEmployee = payload.employeeId?.trim() ?? '';
    const viewerEmployee = this.viewer().employeeId?.trim() ?? '';
    const employeeId = this.canManage() ? selectedEmployee : viewerEmployee;
    if (!employeeId) {
      this.errorState.set(
        this.canManage()
          ? 'Select an employee before submitting this request.'
          : 'Your account is not linked to an employee profile.'
      );
      return null;
    }

    return {
      employeeId,
      type,
      startDate,
      endDate,
      reason: payload.reason?.trim() ?? ''
    };
  }

  private normalizeType(value: string): LeaveRequestType | null {
    if (
      value === 'vacation' ||
      value === 'sick' ||
      value === 'personal' ||
      value === 'maternity' ||
      value === 'paternity'
    ) {
      return value;
    }
    return null;
  }

  private setError(error: unknown, fallback: string): void {
    if (error instanceof Error && error.message.trim().length > 0) {
      this.errorState.set(error.message);
      return;
    }
    this.errorState.set(fallback);
  }
}
