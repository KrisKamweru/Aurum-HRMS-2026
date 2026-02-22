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
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Payroll Runs</h1>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Create, process, and finalize payroll cycles with sensitive-change approvals and payslip traceability.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <ui-button variant="secondary" size="sm" [disabled]="isListLoading()" (onClick)="refresh()">Refresh</ui-button>
          <ui-button variant="primary" size="sm" [disabled]="isSaving()" (onClick)="openCreateModal()">New Run</ui-button>
        </div>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" [disabled]="isListLoading()" (onClick)="refresh()">Retry</ui-button>
        </section>
      }

      <section class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-2xl border border-white/[0.55] bg-white/[0.82] p-4 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.05]">
          <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">YTD Net Processed</p>
          <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ totalProcessedYtd() | currency }}</p>
        </article>
        <article class="rounded-2xl border border-white/[0.55] bg-white/[0.82] p-4 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.05]">
          <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Employees Paid</p>
          <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ employeesPaidYtd() }}</p>
        </article>
        <article class="rounded-2xl border border-white/[0.55] bg-white/[0.82] p-4 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.05]">
          <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Pending Runs</p>
          <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ pendingRunCount() }}</p>
        </article>
        <article class="rounded-2xl border border-white/[0.55] bg-white/[0.82] p-4 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.05]">
          <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Awaiting Sensitive Review</p>
          <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ pendingChanges().length }}</p>
        </article>
      </section>

      @if (isListLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-4 w-40 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-28 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else {
        <section class="mb-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="border-b border-stone-200 px-4 py-3 dark:border-white/8">
            <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Payroll Runs</p>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-[#eeedf0] text-xs font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.02] dark:text-stone-400">
                <tr>
                  <th class="px-4 py-3">Period</th>
                  <th class="px-4 py-3">Run Date</th>
                  <th class="px-4 py-3">Employees</th>
                  <th class="px-4 py-3">Net Pay</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (runs().length === 0) {
                  <tr>
                    <td colspan="6" class="px-4 py-5 text-center text-stone-500 dark:text-stone-400">No payroll runs created yet.</td>
                  </tr>
                } @else {
                  @for (run of runs(); track run.id) {
                    <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                      <td class="px-4 py-3 font-semibold text-stone-800 dark:text-stone-100">{{ periodLabel(run.month, run.year) }}</td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ run.runDate | date: 'MMM d, y' }}</td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ run.employeeCount }}</td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ run.totalNetPay | currency }}</td>
                      <td class="px-4 py-3">
                        <ui-badge size="sm" [rounded]="true" [variant]="runStatusVariant(run.status)">{{ run.status }}</ui-badge>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <ui-button size="sm" variant="secondary" (onClick)="viewRun(run.id)">View</ui-button>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </section>

        @if (pendingChanges().length > 0) {
          <section class="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 shadow-sm dark:border-amber-700/30 dark:bg-amber-900/10">
            <div class="border-b border-amber-200 px-4 py-3 dark:border-amber-700/30">
              <p class="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">Pending Sensitive Changes</p>
            </div>

            <div class="overflow-x-auto">
              <table class="min-w-full text-left text-sm">
                <thead class="bg-amber-100/70 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-800/20 dark:text-amber-300">
                  <tr>
                    <th class="px-4 py-3">Target</th>
                    <th class="px-4 py-3">Operation</th>
                    <th class="px-4 py-3">Reason</th>
                    <th class="px-4 py-3">Requested</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (change of pendingChanges(); track change.id) {
                    <tr class="border-t border-amber-100 dark:border-amber-700/20">
                      <td class="px-4 py-3 font-medium text-stone-800 dark:text-stone-100">{{ change.targetTable }}</td>
                      <td class="px-4 py-3">
                        <ui-badge size="sm" [rounded]="true" [variant]="operationVariant(change.operation)">{{ change.operation }}</ui-badge>
                      </td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ change.reason || 'No reason provided' }}</td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ change.createdAt | date: 'MMM d, y, h:mm a' }}</td>
                      <td class="px-4 py-3">
                        <div class="flex justify-end gap-2">
                          <ui-button size="sm" variant="outline" [disabled]="isSaving()" (onClick)="requestReviewChange(change.id, 'rejected')">Reject</ui-button>
                          <ui-button size="sm" variant="primary" [disabled]="isSaving()" (onClick)="requestReviewChange(change.id, 'approved')">Approve</ui-button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
      }

      <ui-modal
        [isOpen]="isCreateModalOpen()"
        (isOpenChange)="isCreateModalOpen.set($event)"
        [canDismiss]="true"
        [hasFooter]="false"
        width="normal"
        title="Create Payroll Run"
      >
        <app-dynamic-form
          container="modal"
          [fields]="createRunFields"
          [sections]="createRunSections"
          [steps]="createRunSteps"
          [initialValues]="createInitialValues()"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Create Draft"
          (cancel)="closeCreateModal()"
          (formSubmit)="createRunFromForm($event)"
        />
      </ui-modal>

      <ui-confirm-dialog
        [isOpen]="isReviewDialogOpen()"
        (isOpenChange)="isReviewDialogOpen.set($event)"
        [options]="reviewDialogOptions()"
        (confirm)="confirmReview($event)"
      />
    </main>
  `
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
