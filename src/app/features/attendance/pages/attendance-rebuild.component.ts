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
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Attendance</h1>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Clock in/out, track monthly performance, and review your personal attendance history.
          </p>
        </div>
        <div class="text-right">
          <p class="text-3xl font-semibold text-burgundy-700 dark:text-burgundy-300">{{ currentTime() | date: 'h:mm:ss a' }}</p>
          <p class="text-sm text-stone-600 dark:text-stone-400">{{ currentTime() | date: 'EEEE, MMM d, y' }}</p>
        </div>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
        </section>
      }

      @if (attendanceState() === 'unlinked') {
        <section class="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700/30 dark:bg-amber-900/20 dark:text-amber-300">
          Your account is not linked to an employee profile. Contact HR to enable attendance tracking.
        </section>
      }

      <section class="mb-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <article class="rounded-2xl border border-white/[0.55] bg-white/[0.82] p-6 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.05]">
          <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Today</p>
          <h2 class="mt-2 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ attendanceStateLabel() }}</h2>

          @if (todayStatus()) {
            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <div class="rounded-xl border border-stone-200/80 bg-white/80 p-3 dark:border-white/8 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Clock In</p>
                <p class="mt-1 font-semibold text-stone-800 dark:text-stone-100">{{ todayStatus()?.clockIn | date: 'shortTime' }}</p>
              </div>
              <div class="rounded-xl border border-stone-200/80 bg-white/80 p-3 dark:border-white/8 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Clock Out</p>
                <p class="mt-1 font-semibold text-stone-800 dark:text-stone-100">
                  @if (todayStatus()?.clockOut) {
                    {{ todayStatus()?.clockOut | date: 'shortTime' }}
                  } @else {
                    Working...
                  }
                </p>
              </div>
              <div class="rounded-xl border border-stone-200/80 bg-white/80 p-3 dark:border-white/8 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Work Hours</p>
                <p class="mt-1 font-semibold text-stone-800 dark:text-stone-100">{{ formatDuration(todayStatus()?.workMinutes ?? 0) }}</p>
              </div>
            </div>
          }

          <div class="mt-5 flex flex-wrap items-center gap-2">
            @if (attendanceState() === 'not-clocked-in') {
              <ui-button variant="primary" [disabled]="isActionLoading()" (onClick)="handleClockIn()">Clock In</ui-button>
            }
            @if (attendanceState() === 'working') {
              <ui-button variant="danger" [disabled]="isActionLoading()" (onClick)="handleClockOut()">Clock Out</ui-button>
            }
            <ui-button variant="secondary" [disabled]="isPersonalLoading()" (onClick)="refresh()">Refresh</ui-button>
          </div>
        </article>

        <article class="rounded-2xl border border-white/[0.55] bg-white/[0.82] p-6 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.05]">
          <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Month Summary</p>
          <div class="mt-4 space-y-3 text-sm">
            <div class="flex items-center justify-between rounded-lg border border-stone-200/80 px-3 py-2 dark:border-white/8">
              <span>Present</span>
              <span class="font-semibold">{{ summary().presentDays }}</span>
            </div>
            <div class="flex items-center justify-between rounded-lg border border-stone-200/80 px-3 py-2 dark:border-white/8">
              <span>Late</span>
              <span class="font-semibold">{{ summary().lateDays }}</span>
            </div>
            <div class="flex items-center justify-between rounded-lg border border-stone-200/80 px-3 py-2 dark:border-white/8">
              <span>Absent</span>
              <span class="font-semibold">{{ summary().absentDays }}</span>
            </div>
            <div class="flex items-center justify-between rounded-lg border border-stone-200/80 px-3 py-2 dark:border-white/8">
              <span>Average Hours</span>
              <span class="font-semibold">{{ formatDuration(summary().avgWorkMinutes) }}</span>
            </div>
          </div>
        </article>
      </section>

      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
        <div class="border-b border-stone-200 px-4 py-3 dark:border-white/8">
          <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Last 30 Days</p>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-[#eeedf0] text-xs font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.02] dark:text-stone-400">
              <tr>
                <th class="px-4 py-3">Date</th>
                <th class="px-4 py-3">Clock In</th>
                <th class="px-4 py-3">Clock Out</th>
                <th class="px-4 py-3">Hours</th>
                <th class="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              @if (history().length === 0) {
                <tr>
                  <td colspan="5" class="px-4 py-5 text-center text-stone-500 dark:text-stone-400">No attendance records found.</td>
                </tr>
              } @else {
                @for (row of history(); track row.id) {
                  <tr class="border-t border-stone-100 dark:border-white/[0.03]">
                    <td class="px-4 py-3 text-stone-700 dark:text-stone-300">{{ row.date | date: 'MMM d, y' }}</td>
                    <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ row.clockIn ? (row.clockIn | date: 'shortTime') : '—' }}</td>
                    <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ row.clockOut ? (row.clockOut | date: 'shortTime') : '—' }}</td>
                    <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ formatDuration(row.workMinutes) }}</td>
                    <td class="px-4 py-3">
                      <ui-badge size="sm" [rounded]="true" [variant]="statusVariant(row.status)">{{ row.status }}</ui-badge>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </section>

      <ui-confirm-dialog
        [isOpen]="isReasonDialogOpen()"
        (isOpenChange)="isReasonDialogOpen.set($event)"
        [options]="reasonDialogOptions()"
        (confirm)="confirmReasonAction($event)"
      />
    </main>
  `
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
