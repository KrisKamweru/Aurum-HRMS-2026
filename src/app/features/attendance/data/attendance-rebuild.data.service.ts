import { Injectable, inject } from '@angular/core';
import { api } from '../../../../../convex/_generated/api';
import { Id, TableNames } from '../../../../../convex/_generated/dataModel';
import { AppRole } from '../../../core/auth/auth.types';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import {
  RebuildAttendanceRecord,
  RebuildAttendanceStatus,
  RebuildAttendanceSummary,
  RebuildAttendanceViewerContext,
  RebuildHeldTrustEvent,
  RebuildManualAttendanceEntryInput,
  RebuildTeamAttendanceRow,
  ReviewHeldEventInput
} from './attendance-rebuild.models';

@Injectable({ providedIn: 'root' })
export class AttendanceRebuildDataService {
  private readonly convexClient = inject(ConvexClientService);
  private readonly convex = this.convexClient.getHttpClient();

  async getViewerContext(): Promise<RebuildAttendanceViewerContext> {
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

  async getTodayStatus(): Promise<RebuildAttendanceRecord | null> {
    const record = await this.convex.query(api.attendance.getTodayStatus, {});
    return this.mapAttendanceRecord(record);
  }

  async listMyAttendance(startDate: string, endDate: string): Promise<RebuildAttendanceRecord[]> {
    const records = await this.convex.query(api.attendance.getMyAttendance, { startDate, endDate });
    if (!Array.isArray(records)) {
      return [];
    }
    return records
      .map((record) => this.mapAttendanceRecord(record))
      .filter((record): record is RebuildAttendanceRecord => record !== null);
  }

  async getAttendanceSummary(month: string): Promise<RebuildAttendanceSummary> {
    const summary = await this.convex.query(api.attendance.getAttendanceSummary, { month });
    if (!summary || typeof summary !== 'object') {
      return {
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        totalWorkMinutes: 0,
        avgWorkMinutes: 0
      };
    }
    const record = summary as Record<string, unknown>;
    return {
      presentDays: this.readNumber(record['presentDays']),
      absentDays: this.readNumber(record['absentDays']),
      lateDays: this.readNumber(record['lateDays']),
      totalWorkMinutes: this.readNumber(record['totalWorkMinutes']),
      avgWorkMinutes: this.readNumber(record['avgWorkMinutes'])
    };
  }

  async listTeamAttendance(date: string): Promise<RebuildTeamAttendanceRow[]> {
    const rows = await this.convex.query(api.attendance.getTeamAttendance, { date });
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapTeamRow(row))
      .filter((row): row is RebuildTeamAttendanceRow => row !== null);
  }

  async listHeldTrustEvents(limit: number): Promise<RebuildHeldTrustEvent[]> {
    const rows = await this.convex.query(api.attendance.listHeldTrustEvents, { limit });
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapHeldEvent(row))
      .filter((row): row is RebuildHeldTrustEvent => row !== null);
  }

  async clockIn(reason?: string): Promise<RebuildAttendanceRecord | null> {
    const record = await this.convex.mutation(api.attendance.clockIn, {
      trustSignals: {
        reasonCode: 'clock_in_ui',
        reasonText: this.normalizeOptionalText(reason)
      }
    });
    return this.mapAttendanceRecord(record);
  }

  async clockOut(reason?: string): Promise<RebuildAttendanceRecord | null> {
    const record = await this.convex.mutation(api.attendance.clockOut, {
      trustSignals: {
        reasonCode: 'clock_out_ui',
        reasonText: this.normalizeOptionalText(reason)
      }
    });
    return this.mapAttendanceRecord(record);
  }

  async createManualEntry(input: RebuildManualAttendanceEntryInput): Promise<void> {
    await this.convex.mutation(api.attendance.manualEntry, {
      employeeId: this.toId('employees', input.employeeId),
      date: input.date,
      clockIn: this.normalizeOptionalText(input.clockIn),
      clockOut: this.normalizeOptionalText(input.clockOut),
      status: input.status,
      breakMinutes: input.breakMinutes ?? 0,
      notes: this.normalizeOptionalText(input.notes),
      trustSignals: {
        reasonCode: 'manual_entry_ui',
        reasonText: this.normalizeOptionalText(input.notes)
      }
    });
  }

  async reviewHeldTrustEvent(input: ReviewHeldEventInput): Promise<void> {
    await this.convex.mutation(api.attendance.reviewHeldTrustEvent, {
      eventId: this.toId('attendance_trust_events', input.eventId),
      decision: input.decision,
      reviewNote: this.normalizeOptionalText(input.reviewNote)
    });
  }

  private mapTeamRow(row: unknown): RebuildTeamAttendanceRow | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const value = row as Record<string, unknown>;
    const employee = value['employee'];
    if (!employee || typeof employee !== 'object') {
      return null;
    }
    const employeeRecord = employee as Record<string, unknown>;
    if (
      typeof employeeRecord['id'] !== 'string' ||
      typeof employeeRecord['name'] !== 'string' ||
      typeof employeeRecord['email'] !== 'string'
    ) {
      return null;
    }

    return {
      employeeId: employeeRecord['id'],
      employeeName: employeeRecord['name'],
      employeeEmail: employeeRecord['email'],
      employeeDepartmentId:
        typeof employeeRecord['departmentId'] === 'string' ? employeeRecord['departmentId'] : undefined,
      employeeDesignationId:
        typeof employeeRecord['designationId'] === 'string' ? employeeRecord['designationId'] : undefined,
      attendance: this.mapAttendanceRecord(value['attendance'])
    };
  }

  private mapHeldEvent(row: unknown): RebuildHeldTrustEvent | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['employeeId'] !== 'string' ||
      typeof value['employeeName'] !== 'string' ||
      typeof value['capturedAt'] !== 'string' ||
      (value['eventType'] !== 'clock_in' && value['eventType'] !== 'clock_out' && value['eventType'] !== 'manual_entry') ||
      (value['riskLevel'] !== 'low' && value['riskLevel'] !== 'medium' && value['riskLevel'] !== 'high')
    ) {
      return null;
    }
    return {
      id: value['_id'],
      employeeId: value['employeeId'],
      employeeName: value['employeeName'],
      eventType: value['eventType'],
      riskLevel: value['riskLevel'],
      riskScore: this.readNumber(value['riskScore']),
      capturedAt: value['capturedAt']
    };
  }

  private mapAttendanceRecord(record: unknown): RebuildAttendanceRecord | null {
    if (!record || typeof record !== 'object') {
      return null;
    }
    const value = record as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['date'] !== 'string' ||
      !this.isAttendanceStatus(value['status'])
    ) {
      return null;
    }
    return {
      id: value['_id'],
      date: value['date'],
      clockIn: typeof value['clockIn'] === 'string' ? value['clockIn'] : undefined,
      clockOut: typeof value['clockOut'] === 'string' ? value['clockOut'] : undefined,
      status: value['status'],
      workMinutes: this.readNumber(value['workMinutes']),
      breakMinutes: this.readNumber(value['breakMinutes']),
      notes: typeof value['notes'] === 'string' ? value['notes'] : ''
    };
  }

  private isAttendanceStatus(value: unknown): value is RebuildAttendanceStatus {
    return (
      value === 'present' ||
      value === 'absent' ||
      value === 'late' ||
      value === 'half-day' ||
      value === 'on-leave' ||
      value === 'holiday'
    );
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

  private readNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
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
