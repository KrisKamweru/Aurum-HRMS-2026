import { AppRole } from '../../../core/auth/auth.types';

export type RebuildAttendanceStatus = 'present' | 'absent' | 'late' | 'half-day' | 'on-leave' | 'holiday';
export type RebuildAttendanceState = 'unlinked' | 'not-clocked-in' | 'working' | 'clocked-out';
export type AttendanceActionCode = 'ok' | 'reason_required' | 'held' | 'denied' | 'error';
export type HeldEventDecision = 'approved' | 'rejected';
export type TrustRiskLevel = 'low' | 'medium' | 'high';
export type TrustEventType = 'clock_in' | 'clock_out' | 'manual_entry';

export interface RebuildAttendanceRecord {
  id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: RebuildAttendanceStatus;
  workMinutes: number;
  breakMinutes: number;
  notes: string;
}

export interface RebuildAttendanceSummary {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalWorkMinutes: number;
  avgWorkMinutes: number;
}

export interface RebuildAttendanceViewerContext {
  role: AppRole;
  employeeId?: string;
}

export interface RebuildTeamAttendanceRow {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeDepartmentId?: string;
  employeeDesignationId?: string;
  attendance: RebuildAttendanceRecord | null;
}

export interface RebuildHeldTrustEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  eventType: TrustEventType;
  riskLevel: TrustRiskLevel;
  riskScore: number;
  capturedAt: string;
}

export interface RebuildManualAttendanceEntryInput {
  employeeId: string;
  date: string;
  status: RebuildAttendanceStatus;
  clockIn?: string;
  clockOut?: string;
  breakMinutes?: number;
  notes?: string;
}

export interface ReviewHeldEventInput {
  eventId: string;
  decision: HeldEventDecision;
  reviewNote?: string;
}

export interface AttendanceActionResult {
  success: boolean;
  code: AttendanceActionCode;
  message: string;
}
