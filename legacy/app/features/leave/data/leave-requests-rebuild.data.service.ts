import { Injectable, inject } from '@angular/core';
import { api } from '../../../../../convex/_generated/api';
import { Id, TableNames } from '../../../../../convex/_generated/dataModel';
import { AppRole } from '../../../core/auth/auth.types';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import {
  CreateLeaveRequestInput,
  LeaveRequestStatusMutationInput,
  LeaveRequestStatus,
  LeaveRequestType,
  RebuildLeaveEmployeeOption,
  RebuildLeaveRequest,
  RebuildLeaveViewerContext
} from './leave-requests-rebuild.models';

@Injectable({ providedIn: 'root' })
export class LeaveRequestsRebuildDataService {
  private readonly convexClient = inject(ConvexClientService);
  private readonly convex = this.convexClient.getHttpClient();

  async listRequests(): Promise<RebuildLeaveRequest[]> {
    const records = await this.convex.query(api.leave_requests.list, {});
    if (!Array.isArray(records)) {
      return [];
    }

    return records
      .map((record) => this.mapRequest(record))
      .filter((record): record is RebuildLeaveRequest => record !== null);
  }

  async listEmployeeOptions(): Promise<RebuildLeaveEmployeeOption[]> {
    const records = await this.convex.query(api.employees.list, {});
    if (!Array.isArray(records)) {
      return [];
    }

    return records
      .map((record) => this.mapEmployeeOption(record))
      .filter((record): record is RebuildLeaveEmployeeOption => record !== null);
  }

  async getViewerContext(): Promise<RebuildLeaveViewerContext> {
    const viewer = await this.convex.query(api.users.viewer, {});
    if (!viewer || typeof viewer !== 'object') {
      return { role: 'pending' };
    }
    const record = viewer as Record<string, unknown>;
    return {
      role: this.normalizeRole(record['role']),
      employeeId: typeof record['employeeId'] === 'string' ? record['employeeId'] : undefined
    };
  }

  async createRequest(input: CreateLeaveRequestInput): Promise<void> {
    await this.convex.mutation(api.leave_requests.create, {
      employeeId: this.toId('employees', input.employeeId),
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      days: this.calculateLeaveDays(input.startDate, input.endDate),
      reason: this.normalizeOptionalText(input.reason)
    });
  }

  async updateStatus(input: LeaveRequestStatusMutationInput): Promise<void> {
    await this.convex.mutation(api.leave_requests.updateStatus, {
      id: this.toId('leave_requests', input.id),
      status: input.status,
      rejectionReason: this.normalizeOptionalText(input.rejectionReason)
    });
  }

  private mapRequest(record: unknown): RebuildLeaveRequest | null {
    if (!record || typeof record !== 'object') {
      return null;
    }

    const value = record as Record<string, unknown>;
    const id = typeof value['_id'] === 'string' ? value['_id'] : '';
    const employeeId = typeof value['employeeId'] === 'string' ? value['employeeId'] : '';
    const type = this.normalizeType(value['type']);
    const status = this.normalizeStatus(value['status']);
    const startDate = typeof value['startDate'] === 'string' ? value['startDate'] : '';
    const endDate = typeof value['endDate'] === 'string' ? value['endDate'] : '';

    if (!id || !employeeId || !type || !status || !startDate || !endDate) {
      return null;
    }

    return {
      id,
      employeeId,
      employeeName: typeof value['employeeName'] === 'string' ? value['employeeName'] : 'Unknown Employee',
      employeeDepartment: typeof value['employeeDepartment'] === 'string' ? value['employeeDepartment'] : 'Unknown',
      type,
      startDate,
      endDate,
      days: this.readDays(value['days'], startDate, endDate),
      status,
      reason: typeof value['reason'] === 'string' ? value['reason'] : '',
      rejectionReason: typeof value['rejectionReason'] === 'string' ? value['rejectionReason'] : ''
    };
  }

  private mapEmployeeOption(record: unknown): RebuildLeaveEmployeeOption | null {
    if (!record || typeof record !== 'object') {
      return null;
    }
    const value = record as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['firstName'] !== 'string' ||
      typeof value['lastName'] !== 'string'
    ) {
      return null;
    }
    return {
      id: value['_id'],
      label: `${value['firstName']} ${value['lastName']}`.trim(),
      meta: typeof value['email'] === 'string' ? value['email'] : undefined
    };
  }

  private readDays(days: unknown, startDate: string, endDate: string): number {
    if (typeof days === 'number' && Number.isFinite(days) && days > 0) {
      return Math.floor(days);
    }
    return this.calculateLeaveDays(startDate, endDate);
  }

  private calculateLeaveDays(startDate: string, endDate: string): number {
    const start = Date.parse(startDate);
    const end = Date.parse(endDate);
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
      return 1;
    }
    return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }

  private normalizeRole(role: unknown): AppRole {
    switch (role) {
      case 'super_admin':
      case 'admin':
      case 'hr_manager':
      case 'manager':
      case 'employee':
      case 'pending':
        return role;
      default:
        return 'pending';
    }
  }

  private normalizeType(type: unknown): LeaveRequestType | null {
    if (
      type === 'vacation' ||
      type === 'sick' ||
      type === 'personal' ||
      type === 'maternity' ||
      type === 'paternity'
    ) {
      return type;
    }
    return null;
  }

  private normalizeStatus(status: unknown): LeaveRequestStatus | null {
    if (status === 'pending' || status === 'approved' || status === 'rejected' || status === 'cancelled') {
      return status;
    }
    return null;
  }

  private normalizeOptionalText(value: string | undefined): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }

  private toId<T extends TableNames>(table: T, id: string): Id<T> {
    void table;
    return id as Id<T>;
  }
}
