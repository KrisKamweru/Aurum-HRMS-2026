import { Injectable, computed, inject, signal } from '@angular/core';
import { AttendanceRebuildDataService } from './attendance-rebuild.data.service';
import {
  AttendanceActionResult,
  HeldEventDecision,
  RebuildAttendanceRecord,
  RebuildAttendanceState,
  RebuildAttendanceSummary,
  RebuildAttendanceViewerContext,
  RebuildHeldTrustEvent,
  RebuildManualAttendanceEntryInput,
  RebuildTeamAttendanceRow,
  ReviewHeldEventInput
} from './attendance-rebuild.models';

const SUMMARY_EMPTY: RebuildAttendanceSummary = {
  presentDays: 0,
  absentDays: 0,
  lateDays: 0,
  totalWorkMinutes: 0,
  avgWorkMinutes: 0
};

@Injectable({ providedIn: 'root' })
export class AttendanceRebuildStore {
  private readonly data = inject(AttendanceRebuildDataService);

  private readonly viewerState = signal<RebuildAttendanceViewerContext>({ role: 'pending' });
  private readonly todayStatusState = signal<RebuildAttendanceRecord | null>(null);
  private readonly summaryState = signal<RebuildAttendanceSummary>(SUMMARY_EMPTY);
  private readonly historyState = signal<RebuildAttendanceRecord[]>([]);
  private readonly teamRowsState = signal<RebuildTeamAttendanceRow[]>([]);
  private readonly heldTrustEventsState = signal<RebuildHeldTrustEvent[]>([]);
  private readonly selectedTeamDateState = signal<string>(this.todayIso());

  private readonly personalLoadingState = signal(false);
  private readonly teamLoadingState = signal(false);
  private readonly actionLoadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly viewer = this.viewerState.asReadonly();
  readonly todayStatus = this.todayStatusState.asReadonly();
  readonly summary = this.summaryState.asReadonly();
  readonly history = this.historyState.asReadonly();
  readonly teamRows = this.teamRowsState.asReadonly();
  readonly heldTrustEvents = this.heldTrustEventsState.asReadonly();
  readonly selectedTeamDate = this.selectedTeamDateState.asReadonly();

  readonly isPersonalLoading = this.personalLoadingState.asReadonly();
  readonly isTeamLoading = this.teamLoadingState.asReadonly();
  readonly isActionLoading = this.actionLoadingState.asReadonly();
  readonly isSaving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly canManage = computed(() => {
    const role = this.viewer().role;
    return role === 'super_admin' || role === 'admin' || role === 'hr_manager' || role === 'manager';
  });

  readonly attendanceState = computed<RebuildAttendanceState>(() => {
    if (!this.viewer().employeeId) {
      return 'unlinked';
    }
    const today = this.todayStatus();
    if (!today) {
      return 'not-clocked-in';
    }
    if (!today.clockOut) {
      return 'working';
    }
    return 'clocked-out';
  });

  readonly presentTeamCount = computed(
    () => this.teamRows().filter((row) => row.attendance?.status === 'present' || row.attendance?.status === 'half-day').length
  );
  readonly lateTeamCount = computed(() => this.teamRows().filter((row) => row.attendance?.status === 'late').length);
  readonly absentTeamCount = computed(
    () => this.teamRows().filter((row) => !row.attendance || row.attendance.status === 'absent').length
  );
  readonly onLeaveTeamCount = computed(
    () => this.teamRows().filter((row) => row.attendance?.status === 'on-leave').length
  );

  async loadPersonalDashboard(now: Date = new Date()): Promise<void> {
    this.personalLoadingState.set(true);
    this.clearError();
    try {
      const viewer = await this.data.getViewerContext();
      this.viewerState.set(viewer);
      if (!viewer.employeeId) {
        this.todayStatusState.set(null);
        this.summaryState.set(SUMMARY_EMPTY);
        this.historyState.set([]);
        return;
      }

      const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      const endDate = this.isoDate(now);
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      start.setUTCDate(start.getUTCDate() - 30);
      const startDate = this.isoDate(start);

      const [today, history, summary] = await Promise.all([
        this.data.getTodayStatus(),
        this.data.listMyAttendance(startDate, endDate),
        this.data.getAttendanceSummary(monthKey)
      ]);

      this.todayStatusState.set(today);
      this.historyState.set(history);
      this.summaryState.set(summary);
    } catch (error: unknown) {
      this.setError(error, 'Unable to load attendance dashboard.');
    } finally {
      this.personalLoadingState.set(false);
    }
  }

  async loadTeamDashboard(date: string): Promise<void> {
    this.selectedTeamDateState.set(date);
    this.teamLoadingState.set(true);
    this.clearError();
    try {
      const [rows, held] = await Promise.all([
        this.data.listTeamAttendance(date),
        this.data.listHeldTrustEvents(25)
      ]);
      this.teamRowsState.set(rows);
      this.heldTrustEventsState.set(held);
    } catch (error: unknown) {
      this.setError(error, 'Unable to load team attendance.');
    } finally {
      this.teamLoadingState.set(false);
    }
  }

  async clockIn(reason?: string): Promise<AttendanceActionResult> {
    return this.runPunchAction(() => this.data.clockIn(reason));
  }

  async clockOut(reason?: string): Promise<AttendanceActionResult> {
    return this.runPunchAction(() => this.data.clockOut(reason));
  }

  async saveManualEntry(input: RebuildManualAttendanceEntryInput): Promise<boolean> {
    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.createManualEntry(input);
      await this.loadTeamDashboard(input.date);
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to save attendance entry.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async reviewHeldEvent(input: ReviewHeldEventInput): Promise<boolean> {
    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.reviewHeldTrustEvent(input);
      await this.refreshHeldTrustEvents();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to review held attendance event.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private async refreshHeldTrustEvents(): Promise<void> {
    this.heldTrustEventsState.set(await this.data.listHeldTrustEvents(25));
  }

  private async runPunchAction(action: () => Promise<RebuildAttendanceRecord | null>): Promise<AttendanceActionResult> {
    this.actionLoadingState.set(true);
    this.clearError();
    try {
      await action();
      await this.loadPersonalDashboard();
      return { success: true, code: 'ok', message: '' };
    } catch (error: unknown) {
      const parsed = this.parseAttendanceError(error);
      this.errorState.set(parsed.message);
      return { success: false, code: parsed.code, message: parsed.message };
    } finally {
      this.actionLoadingState.set(false);
    }
  }

  private parseAttendanceError(error: unknown): { code: AttendanceActionResult['code']; message: string } {
    const fallback = 'Unable to complete attendance action.';
    if (!(error instanceof Error) || error.message.trim().length === 0) {
      return { code: 'error', message: fallback };
    }

    const message = error.message;
    if (message.includes('ATTENDANCE_REASON_REQUIRED')) {
      return { code: 'reason_required', message: this.extractSuffixMessage(message, 'ATTENDANCE_REASON_REQUIRED') };
    }
    if (message.includes('ATTENDANCE_PUNCH_HELD')) {
      return { code: 'held', message: this.extractSuffixMessage(message, 'ATTENDANCE_PUNCH_HELD') };
    }
    if (message.includes('ATTENDANCE_PUNCH_DENIED')) {
      return { code: 'denied', message: this.extractSuffixMessage(message, 'ATTENDANCE_PUNCH_DENIED') };
    }
    return { code: 'error', message };
  }

  private extractSuffixMessage(message: string, code: string): string {
    const prefix = `${code}:`;
    if (!message.startsWith(prefix)) {
      return message;
    }
    const normalized = message.slice(prefix.length).trim();
    return normalized.length > 0 ? normalized : message;
  }

  private setError(error: unknown, fallback: string): void {
    if (error instanceof Error && error.message.trim().length > 0) {
      this.errorState.set(error.message);
      return;
    }
    this.errorState.set(fallback);
  }

  private todayIso(): string {
    return this.isoDate(new Date());
  }

  private isoDate(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
