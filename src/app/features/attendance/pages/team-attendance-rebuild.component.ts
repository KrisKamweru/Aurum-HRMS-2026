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
  template: ''
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
