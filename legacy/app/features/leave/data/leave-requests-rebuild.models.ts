import { AppRole } from '../../../core/auth/auth.types';

export type LeaveRequestType = 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity';
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface RebuildLeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  type: LeaveRequestType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveRequestStatus;
  reason: string;
  rejectionReason: string;
}

export interface RebuildLeaveEmployeeOption {
  id: string;
  label: string;
  meta?: string;
}

export interface RebuildLeaveViewerContext {
  role: AppRole;
  employeeId?: string;
}

export interface CreateLeaveRequestInput {
  employeeId: string;
  type: LeaveRequestType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface LeaveRequestStatusMutationInput {
  id: string;
  status: Exclude<LeaveRequestStatus, 'pending'>;
  rejectionReason?: string;
}
