import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { RebuildAttendanceStatus } from '../data/attendance-rebuild.models';
import { AttendanceRebuildStore } from '../data/attendance-rebuild.store';

type PunchAction = 'clock-in' | 'clock-out';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-attendance-rebuild',
  imports: [DatePipe, UiBadgeComponent, UiButtonComponent, UiConfirmDialogComponent],
  template: ''
})
export class AttendanceRebuildComponent implements OnInit, OnDestroy {
  private readonly store = inject(AttendanceRebuildStore);

  readonly viewer = this.store.viewer;
  readonly todayStatus = this.store.todayStatus;
  readonly summary = this.store.summary;
  readonly history = this.store.history;
  readonly isPersonalLoading = this.store.isPersonalLoading;
  readonly isActionLoading = this.store.isActionLoading;
  readonly error = this.store.error;
  readonly attendanceState = this.store.attendanceState;
  readonly canManage = this.store.canManage;

  readonly currentTime = signal(new Date());
  readonly isReasonDialogOpen = signal(false);
  readonly pendingReasonAction = signal<PunchAction | null>(null);

  readonly reasonDialogOptions = computed<ConfirmDialogOptions>(() => ({
    title: this.pendingReasonAction() === 'clock-out' ? 'Clock Out Reason' : 'Clock In Reason',
    message: 'This punch was flagged by trust checks. Add a short reason to continue.',
    confirmText: 'Submit Punch',
    cancelText: 'Cancel',
    variant: 'warning',
    reasonRequired: true,
    reasonLabel: 'Reason',
    reasonPlaceholder: 'Provide context for this punch'
  }));

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    void this.store.loadPersonalDashboard();
    this.timerId = setInterval(() => this.currentTime.set(new Date()), 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  refresh(): void {
    void this.store.loadPersonalDashboard();
  }

  async handleClockIn(reason?: string): Promise<void> {
    const result = await this.store.clockIn(reason);
    if (!result.success && result.code === 'reason_required') {
      this.pendingReasonAction.set('clock-in');
      this.isReasonDialogOpen.set(true);
    }
  }

  async handleClockOut(reason?: string): Promise<void> {
    const result = await this.store.clockOut(reason);
    if (!result.success && result.code === 'reason_required') {
      this.pendingReasonAction.set('clock-out');
      this.isReasonDialogOpen.set(true);
    }
  }

  async confirmReasonAction(reason: string): Promise<void> {
    const action = this.pendingReasonAction();
    if (!action) {
      return;
    }

    const result = action === 'clock-out' ? await this.store.clockOut(reason) : await this.store.clockIn(reason);
    if (result.code !== 'reason_required') {
      this.pendingReasonAction.set(null);
      this.isReasonDialogOpen.set(false);
    }
  }

  attendanceStateLabel(): string {
    const state = this.attendanceState();
    if (state === 'unlinked') {
      return 'Account Not Linked';
    }
    if (state === 'not-clocked-in') {
      return 'Not Clocked In';
    }
    if (state === 'working') {
      return 'Currently Working';
    }
    return 'Clocked Out';
  }

  statusVariant(status: RebuildAttendanceStatus): BadgeVariant {
    if (status === 'present') {
      return 'success';
    }
    if (status === 'late' || status === 'half-day') {
      return 'warning';
    }
    if (status === 'absent') {
      return 'danger';
    }
    if (status === 'on-leave') {
      return 'info';
    }
    return 'neutral';
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}
