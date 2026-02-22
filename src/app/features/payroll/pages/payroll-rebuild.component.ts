import { DatePipe, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { PayrollReviewDecision, PayrollRunStatus } from '../data/payroll-rebuild.models';
import { PayrollRebuildStore } from '../data/payroll-rebuild.store';

interface PayrollPeriod {
  month: number;
  year: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-payroll-rebuild',
  imports: [
    DatePipe,
    CurrencyPipe,
    UiBadgeComponent,
    UiButtonComponent,
    UiModalComponent,
    DynamicFormComponent,
    UiConfirmDialogComponent
  ],
  template: ''
})
export class PayrollRebuildComponent implements OnInit {
  private readonly store = inject(PayrollRebuildStore);
  private readonly router = inject(Router);

  readonly runs = this.store.runs;
  readonly pendingChanges = this.store.pendingChanges;
  readonly isListLoading = this.store.isListLoading;
  readonly isSaving = this.store.isSaving;
  readonly error = this.store.error;

  readonly totalProcessedYtd = this.store.totalProcessedYtd;
  readonly employeesPaidYtd = this.store.employeesPaidYtd;
  readonly pendingRunCount = this.store.pendingRunCount;

  readonly isCreateModalOpen = signal(false);
  readonly createInitialValues = signal<Record<string, unknown>>({});

  readonly isReviewDialogOpen = signal(false);
  readonly pendingReviewChangeId = signal<string | null>(null);
  readonly pendingReviewDecision = signal<PayrollReviewDecision | null>(null);

  readonly createRunSections: FormSectionConfig[] = [
    {
      id: 'period',
      title: 'Payroll Period',
      description: 'Select the month and year to open as a draft payroll run.',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Confirm this run period is accurate before creating a draft.',
      columns: { base: 1, md: 1, lg: 1 }
    }
  ];

  readonly createRunSteps: FormStepConfig[] = [
    { id: 'run-step-1', title: 'Period', sectionIds: ['period'] },
    { id: 'run-step-2', title: 'Review', sectionIds: ['review'] }
  ];

  readonly reviewDialogOptions = computed<ConfirmDialogOptions>(() => {
    if (this.pendingReviewDecision() === 'rejected') {
      return {
        title: 'Reject Sensitive Change',
        message: 'Reject this change request and provide the reason for denial.',
        confirmText: 'Reject',
        cancelText: 'Cancel',
        variant: 'danger',
        reasonRequired: true,
        reasonLabel: 'Rejection reason',
        reasonPlaceholder: 'Explain why this request is rejected'
      };
    }
    return {
      title: 'Approve Sensitive Change',
      message: 'Approve and apply this sensitive payroll change now?',
      confirmText: 'Approve',
      cancelText: 'Cancel',
      variant: 'warning'
    };
  });

  get createRunFields(): FieldConfig[] {
    const currentYear = new Date().getFullYear();
    return [
      {
        name: 'month',
        label: 'Month',
        type: 'select',
        sectionId: 'period',
        required: true,
        options: [
          { label: 'January', value: 1 },
          { label: 'February', value: 2 },
          { label: 'March', value: 3 },
          { label: 'April', value: 4 },
          { label: 'May', value: 5 },
          { label: 'June', value: 6 },
          { label: 'July', value: 7 },
          { label: 'August', value: 8 },
          { label: 'September', value: 9 },
          { label: 'October', value: 10 },
          { label: 'November', value: 11 },
          { label: 'December', value: 12 }
        ]
      },
      {
        name: 'year',
        label: 'Year',
        type: 'number',
        sectionId: 'period',
        required: true,
        placeholder: currentYear.toString()
      },
      {
        name: 'confirm',
        label: 'Confirmation',
        type: 'checkbox',
        sectionId: 'review',
        required: true,
        hint: 'I confirmed there is no existing run for this payroll period.'
      }
    ];
  }

  ngOnInit(): void {
    void this.store.loadPayrollHome();
  }

  refresh(): void {
    void this.store.loadPayrollHome();
  }

  openCreateModal(): void {
    const period = this.nextRunPeriod();
    this.createInitialValues.set({
      month: period.month,
      year: period.year,
      confirm: false
    });
    this.isCreateModalOpen.set(true);
    this.store.clearError();
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  async createRunFromForm(payload: Record<string, unknown>): Promise<void> {
    const runId = await this.store.createRun({
      month: this.readNumber(payload, 'month'),
      year: this.readNumber(payload, 'year')
    });

    if (runId) {
      this.closeCreateModal();
      await this.router.navigate(['/payroll', runId]);
    }
  }

  viewRun(id: string): void {
    void this.router.navigate(['/payroll', id]);
  }

  requestReviewChange(changeRequestId: string, decision: PayrollReviewDecision): void {
    this.pendingReviewChangeId.set(changeRequestId);
    this.pendingReviewDecision.set(decision);
    this.isReviewDialogOpen.set(true);
    this.store.clearError();
  }

  async confirmReview(reason: string): Promise<void> {
    const changeRequestId = this.pendingReviewChangeId();
    const decision = this.pendingReviewDecision();
    if (!changeRequestId || !decision) {
      return;
    }

    const success = await this.store.reviewSensitiveChange({
      changeRequestId,
      decision,
      rejectionReason: decision === 'rejected' ? reason.trim() : undefined
    });

    if (success) {
      this.pendingReviewChangeId.set(null);
      this.pendingReviewDecision.set(null);
      this.isReviewDialogOpen.set(false);
    }
  }

  runStatusVariant(status: PayrollRunStatus): BadgeVariant {
    if (status === 'completed') {
      return 'success';
    }
    if (status === 'processing') {
      return 'info';
    }
    return 'neutral';
  }

  operationVariant(operation: string): BadgeVariant {
    if (operation === 'delete') {
      return 'danger';
    }
    if (operation === 'update') {
      return 'warning';
    }
    return 'info';
  }

  periodLabel(month: number, year: number): string {
    return `${this.getMonthName(month)} ${year}`;
  }

  private nextRunPeriod(): PayrollPeriod {
    const runs = this.runs();
    if (runs.length === 0) {
      const now = new Date();
      return { month: now.getMonth() + 1, year: now.getFullYear() };
    }

    const sorted = [...runs].sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });

    const latest = sorted[0];
    if (!latest) {
      const now = new Date();
      return { month: now.getMonth() + 1, year: now.getFullYear() };
    }

    if (latest.month === 12) {
      return { month: 1, year: latest.year + 1 };
    }
    return { month: latest.month + 1, year: latest.year };
  }

  private getMonthName(month: number): string {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
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
}
