import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { HeldEventDecision, RebuildAttendanceStatus, RebuildTeamAttendanceRow } from '../data/attendance-rebuild.models';
import { AttendanceRebuildStore } from '../data/attendance-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-team-attendance-rebuild',
  imports: [DatePipe, UiBadgeComponent, UiButtonComponent, UiModalComponent, DynamicFormComponent, UiConfirmDialogComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Team Attendance</h1>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Review daily team attendance, apply manual corrections, and resolve held trust events.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <input
            type="date"
            [value]="selectedDate()"
            class="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/[0.04] dark:text-stone-100"
            (input)="onDateChange($event)"
          />
          <ui-button variant="secondary" size="sm" [disabled]="isTeamLoading()" (onClick)="refresh()">Refresh</ui-button>
        </div>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          {{ error() }}
        </section>
      }

      <section class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article class="rounded-xl border border-stone-200 bg-white/[0.82] p-4 dark:border-white/8 dark:bg-white/[0.04]">
          <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Present</p>
          <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ presentTeamCount() }}</p>
        </article>
        <article class="rounded-xl border border-stone-200 bg-white/[0.82] p-4 dark:border-white/8 dark:bg-white/[0.04]">
          <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Late</p>
          <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ lateTeamCount() }}</p>
        </article>
        <article class="rounded-xl border border-stone-200 bg-white/[0.82] p-4 dark:border-white/8 dark:bg-white/[0.04]">
          <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Absent</p>
          <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ absentTeamCount() }}</p>
        </article>
        <article class="rounded-xl border border-stone-200 bg-white/[0.82] p-4 dark:border-white/8 dark:bg-white/[0.04]">
          <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">On Leave</p>
          <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ onLeaveTeamCount() }}</p>
        </article>
      </section>

      @if (heldTrustEvents().length > 0) {
        <section class="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-700/30 dark:bg-amber-900/10">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">Held Punches</h2>
          <div class="mt-3 space-y-2">
            @for (event of heldTrustEvents(); track event.id) {
              <article class="rounded-xl border border-amber-200 bg-white px-3 py-2 dark:border-amber-700/40 dark:bg-white/[0.03]">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="font-semibold text-stone-800 dark:text-stone-100">{{ event.employeeName }}</p>
                    <p class="text-xs text-stone-600 dark:text-stone-400">
                      {{ event.eventType }} • {{ event.capturedAt | date: 'MMM d, y, h:mm a' }} • Risk {{ event.riskScore }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <ui-badge size="sm" [rounded]="true" [variant]="riskVariant(event.riskLevel)">
                      {{ event.riskLevel }}
                    </ui-badge>
                    <ui-button size="sm" variant="outline" [disabled]="isSaving()" (onClick)="requestHeldEventDecision(event.id, 'rejected')">Reject</ui-button>
                    <ui-button size="sm" variant="primary" [disabled]="isSaving()" (onClick)="requestHeldEventDecision(event.id, 'approved')">Approve</ui-button>
                  </div>
                </div>
              </article>
            }
          </div>
        </section>
      }

      <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-[#eeedf0] text-xs font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.02] dark:text-stone-400">
              <tr>
                <th class="px-4 py-3">Employee</th>
                <th class="px-4 py-3">Clock In</th>
                <th class="px-4 py-3">Clock Out</th>
                <th class="px-4 py-3">Hours</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (teamRows().length === 0) {
                <tr>
                  <td colspan="6" class="px-4 py-5 text-center text-stone-500 dark:text-stone-400">
                    @if (isTeamLoading()) {
                      Loading team attendance...
                    } @else {
                      No team attendance records for this date.
                    }
                  </td>
                </tr>
              } @else {
                @for (row of teamRows(); track row.employeeId) {
                  <tr class="border-t border-stone-100 dark:border-white/[0.03]">
                    <td class="px-4 py-3">
                      <p class="font-semibold text-stone-800 dark:text-stone-100">{{ row.employeeName }}</p>
                      <p class="text-xs text-stone-500 dark:text-stone-400">{{ row.employeeEmail }}</p>
                    </td>
                    <td class="px-4 py-3 text-stone-600 dark:text-stone-300">
                      {{ row.attendance?.clockIn ? (row.attendance?.clockIn | date: 'shortTime') : '—' }}
                    </td>
                    <td class="px-4 py-3 text-stone-600 dark:text-stone-300">
                      {{ row.attendance?.clockOut ? (row.attendance?.clockOut | date: 'shortTime') : '—' }}
                    </td>
                    <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ formatDuration(row.attendance?.workMinutes ?? 0) }}</td>
                    <td class="px-4 py-3">
                      <ui-badge size="sm" [rounded]="true" [variant]="statusVariant(row.attendance?.status ?? 'absent')">
                        {{ row.attendance?.status ?? 'absent' }}
                      </ui-badge>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <ui-button size="sm" variant="secondary" [disabled]="isSaving()" (onClick)="openManualEntryModal(row)">Edit</ui-button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </section>

      <ui-modal
        [isOpen]="isManualEntryModalOpen()"
        (isOpenChange)="isManualEntryModalOpen.set($event)"
        [canDismiss]="true"
        [hasFooter]="false"
        width="wide"
        title="Manual Attendance Entry"
      >
        <app-dynamic-form
          container="modal"
          [fields]="manualEntryFields"
          [sections]="manualEntrySections"
          [steps]="manualEntrySteps"
          [initialValues]="manualEntryInitialValues()"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Save Entry"
          (cancel)="closeManualEntryModal()"
          (formSubmit)="submitManualEntryFromForm($event)"
        />
      </ui-modal>

      <ui-confirm-dialog
        [isOpen]="isHeldDecisionDialogOpen()"
        (isOpenChange)="isHeldDecisionDialogOpen.set($event)"
        [options]="heldDecisionDialogOptions()"
        (confirm)="confirmHeldEventDecision($event)"
      />
    </main>
  `
})
export class TeamAttendanceRebuildComponent implements OnInit {
  private readonly store = inject(AttendanceRebuildStore);

  readonly teamRows = this.store.teamRows;
  readonly heldTrustEvents = this.store.heldTrustEvents;
  readonly isTeamLoading = this.store.isTeamLoading;
  readonly isSaving = this.store.isSaving;
  readonly error = this.store.error;
  readonly presentTeamCount = this.store.presentTeamCount;
  readonly lateTeamCount = this.store.lateTeamCount;
  readonly absentTeamCount = this.store.absentTeamCount;
  readonly onLeaveTeamCount = this.store.onLeaveTeamCount;

  readonly selectedDate = signal(this.todayIso());
  readonly isManualEntryModalOpen = signal(false);
  readonly selectedEmployeeId = signal<string | null>(null);
  readonly selectedEmployeeName = signal<string>('');
  readonly manualEntryInitialValues = signal<Record<string, unknown>>({});

  readonly isHeldDecisionDialogOpen = signal(false);
  readonly pendingHeldEventId = signal<string | null>(null);
  readonly pendingHeldDecision = signal<HeldEventDecision | null>(null);

  readonly manualEntrySections: FormSectionConfig[] = [
    {
      id: 'timing',
      title: 'Timing',
      description: 'Adjust punch times and breaks',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Status and supporting context',
      columns: { base: 1, md: 2, lg: 2 }
    }
  ];

  readonly manualEntrySteps: FormStepConfig[] = [
    { id: 'manual-step-1', title: 'Timing', sectionIds: ['timing'] },
    { id: 'manual-step-2', title: 'Review', sectionIds: ['review'] }
  ];

  readonly heldDecisionDialogOptions = computed<ConfirmDialogOptions>(() => {
    const decision = this.pendingHeldDecision();
    if (decision === 'rejected') {
      return {
        title: 'Reject Held Punch',
        message: 'Reject this held punch and include a review note.',
        confirmText: 'Reject',
        cancelText: 'Cancel',
        variant: 'danger',
        reasonRequired: true,
        reasonLabel: 'Review note',
        reasonPlaceholder: 'Explain the rejection decision'
      };
    }
    return {
      title: 'Approve Held Punch',
      message: 'Approve this held punch and release it into attendance records.',
      confirmText: 'Approve',
      cancelText: 'Cancel',
      variant: 'warning'
    };
  });

  get manualEntryFields(): FieldConfig[] {
    return [
      {
        name: 'clockIn',
        label: 'Clock In (HH:mm)',
        type: 'text',
        sectionId: 'timing',
        required: false,
        placeholder: '08:30'
      },
      {
        name: 'clockOut',
        label: 'Clock Out (HH:mm)',
        type: 'text',
        sectionId: 'timing',
        required: false,
        placeholder: '17:30'
      },
      {
        name: 'breakMinutes',
        label: 'Break Minutes',
        type: 'number',
        sectionId: 'timing',
        required: false
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        sectionId: 'review',
        required: true,
        options: [
          { label: 'Present', value: 'present' },
          { label: 'Late', value: 'late' },
          { label: 'Half Day', value: 'half-day' },
          { label: 'Absent', value: 'absent' },
          { label: 'On Leave', value: 'on-leave' },
          { label: 'Holiday', value: 'holiday' }
        ]
      },
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        sectionId: 'review',
        required: false,
        colSpan: 2
      }
    ];
  }

  ngOnInit(): void {
    void this.store.loadTeamDashboard(this.selectedDate());
  }

  onDateChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const value = target.value.trim();
    if (!value) {
      return;
    }
    this.selectedDate.set(value);
    void this.store.loadTeamDashboard(value);
  }

  refresh(): void {
    void this.store.loadTeamDashboard(this.selectedDate());
  }

  openManualEntryModal(row: RebuildTeamAttendanceRow): void {
    this.selectedEmployeeId.set(row.employeeId);
    this.selectedEmployeeName.set(row.employeeName);
    this.manualEntryInitialValues.set({
      clockIn: row.attendance?.clockIn ? this.extractTime(row.attendance.clockIn) : '',
      clockOut: row.attendance?.clockOut ? this.extractTime(row.attendance.clockOut) : '',
      breakMinutes: row.attendance?.breakMinutes ?? 0,
      status: row.attendance?.status ?? 'present',
      notes: row.attendance?.notes ?? ''
    });
    this.isManualEntryModalOpen.set(true);
    this.store.clearError();
  }

  closeManualEntryModal(): void {
    this.isManualEntryModalOpen.set(false);
    this.selectedEmployeeId.set(null);
    this.selectedEmployeeName.set('');
  }

  async submitManualEntryFromForm(payload: Record<string, unknown>): Promise<void> {
    const employeeId = this.selectedEmployeeId();
    if (!employeeId) {
      return;
    }
    const success = await this.store.saveManualEntry({
      employeeId,
      date: this.selectedDate(),
      status: this.readStatus(payload, 'status'),
      clockIn: this.mergeDateAndTime(this.selectedDate(), this.readText(payload, 'clockIn')),
      clockOut: this.mergeDateAndTime(this.selectedDate(), this.readText(payload, 'clockOut')),
      breakMinutes: this.readNumber(payload, 'breakMinutes'),
      notes: this.readText(payload, 'notes')
    });
    if (success) {
      this.closeManualEntryModal();
    }
  }

  requestHeldEventDecision(eventId: string, decision: HeldEventDecision): void {
    this.pendingHeldEventId.set(eventId);
    this.pendingHeldDecision.set(decision);
    this.isHeldDecisionDialogOpen.set(true);
    this.store.clearError();
  }

  async confirmHeldEventDecision(reviewNote: string): Promise<void> {
    const eventId = this.pendingHeldEventId();
    const decision = this.pendingHeldDecision();
    if (!eventId || !decision) {
      return;
    }
    const success = await this.store.reviewHeldEvent({
      eventId,
      decision,
      reviewNote: reviewNote.trim().length > 0 ? reviewNote.trim() : undefined
    });
    if (success) {
      this.pendingHeldEventId.set(null);
      this.pendingHeldDecision.set(null);
      this.isHeldDecisionDialogOpen.set(false);
      void this.store.loadTeamDashboard(this.selectedDate());
    }
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

  riskVariant(risk: 'low' | 'medium' | 'high'): BadgeVariant {
    if (risk === 'high') {
      return 'danger';
    }
    if (risk === 'medium') {
      return 'warning';
    }
    return 'neutral';
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  private readText(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];
    return typeof value === 'string' ? value : '';
  }

  private readNumber(payload: Record<string, unknown>, key: string): number {
    const value = payload[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private readStatus(payload: Record<string, unknown>, key: string): RebuildAttendanceStatus {
    const value = this.readText(payload, key);
    if (
      value === 'present' ||
      value === 'absent' ||
      value === 'late' ||
      value === 'half-day' ||
      value === 'on-leave' ||
      value === 'holiday'
    ) {
      return value;
    }
    return 'present';
  }

  private mergeDateAndTime(date: string, time: string): string | undefined {
    const normalized = time.trim();
    if (!normalized) {
      return undefined;
    }
    const parts = normalized.split(':');
    if (parts.length !== 2) {
      return undefined;
    }
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return undefined;
    }
    const instance = new Date(`${date}T00:00:00`);
    instance.setHours(hours, minutes, 0, 0);
    return instance.toISOString();
  }

  private extractTime(iso: string): string {
    const instance = new Date(iso);
    if (Number.isNaN(instance.getTime())) {
      return '';
    }
    const hours = String(instance.getHours()).padStart(2, '0');
    const minutes = String(instance.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
