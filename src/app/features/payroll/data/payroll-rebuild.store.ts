import { Injectable, computed, inject, signal } from '@angular/core';
import { PayrollRebuildDataService } from './payroll-rebuild.data.service';
import {
  PayslipLoadResult,
  PayrollReviewDecision,
  PayrollRunDraftInput,
  PayrollSensitiveReviewInput,
  RebuildPayrollActionResult,
  RebuildPayrollRun,
  RebuildPayrollSlip,
  RebuildPayrollViewerContext,
  RebuildPendingSensitiveChange
} from './payroll-rebuild.models';

@Injectable({ providedIn: 'root' })
export class PayrollRebuildStore {
  private readonly data = inject(PayrollRebuildDataService);

  private readonly viewerState = signal<RebuildPayrollViewerContext>({ role: 'pending' });
  private readonly runsState = signal<RebuildPayrollRun[]>([]);
  private readonly pendingChangesState = signal<RebuildPendingSensitiveChange[]>([]);
  private readonly selectedRunState = signal<RebuildPayrollRun | null>(null);
  private readonly runSlipsState = signal<RebuildPayrollSlip[]>([]);
  private readonly selectedPayslipState = signal<RebuildPayrollSlip | null>(null);

  private readonly listLoadingState = signal(false);
  private readonly detailLoadingState = signal(false);
  private readonly payslipLoadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly actionLoadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly viewer = this.viewerState.asReadonly();
  readonly runs = this.runsState.asReadonly();
  readonly pendingChanges = this.pendingChangesState.asReadonly();
  readonly selectedRun = this.selectedRunState.asReadonly();
  readonly runSlips = this.runSlipsState.asReadonly();
  readonly selectedPayslip = this.selectedPayslipState.asReadonly();

  readonly isListLoading = this.listLoadingState.asReadonly();
  readonly isDetailLoading = this.detailLoadingState.asReadonly();
  readonly isPayslipLoading = this.payslipLoadingState.asReadonly();
  readonly isSaving = this.savingState.asReadonly();
  readonly isActionLoading = this.actionLoadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly canManage = computed(() => {
    const role = this.viewer().role;
    return role === 'super_admin' || role === 'admin' || role === 'hr_manager';
  });

  readonly canReviewSensitiveChanges = computed(() => {
    const role = this.viewer().role;
    return role === 'super_admin' || role === 'admin' || role === 'hr_manager' || role === 'manager';
  });

  readonly pendingRunCount = computed(() => this.runs().filter((run) => run.status !== 'completed').length);

  readonly totalProcessedYtd = computed(() =>
    this.runs()
      .filter((run) => run.status === 'completed' && run.year === this.currentYear())
      .reduce((sum, run) => sum + run.totalNetPay, 0)
  );

  readonly employeesPaidYtd = computed(() =>
    this.runs()
      .filter((run) => run.status === 'completed' && run.year === this.currentYear())
      .reduce((sum, run) => sum + run.employeeCount, 0)
  );

  readonly hasRunSlips = computed(() => this.runSlips().length > 0);

  async loadPayrollHome(): Promise<void> {
    this.listLoadingState.set(true);
    this.clearError();
    try {
      this.viewerState.set(await this.data.getViewerContext());
      if (!this.canManage()) {
        this.runsState.set([]);
        this.pendingChangesState.set([]);
        this.errorState.set('You do not have access to payroll administration.');
        return;
      }

      await this.refreshRunsAndPending();
    } catch (error: unknown) {
      this.setError(error, 'Unable to load payroll dashboard.');
    } finally {
      this.listLoadingState.set(false);
    }
  }

  async createRun(input: PayrollRunDraftInput): Promise<string | null> {
    if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12) {
      this.errorState.set('Payroll month must be between 1 and 12.');
      return null;
    }

    if (!Number.isInteger(input.year) || input.year < 2000 || input.year > 2200) {
      this.errorState.set('Payroll year is invalid.');
      return null;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      const runId = await this.data.createRun(input.month, input.year);
      await this.refreshRunsAndPending();
      return runId;
    } catch (error: unknown) {
      this.setError(error, 'Unable to create payroll run.');
      return null;
    } finally {
      this.savingState.set(false);
    }
  }

  async loadRun(runId: string): Promise<void> {
    this.detailLoadingState.set(true);
    this.clearError();
    try {
      const [run, slips] = await Promise.all([this.data.getRun(runId), this.data.listRunSlips(runId)]);
      this.selectedRunState.set(run);
      this.runSlipsState.set(slips);

      if (!run) {
        this.errorState.set('Payroll run not found.');
      }
    } catch (error: unknown) {
      this.setError(error, 'Unable to load payroll run.');
    } finally {
      this.detailLoadingState.set(false);
    }
  }

  async processRun(runId: string): Promise<boolean> {
    this.actionLoadingState.set(true);
    this.clearError();
    try {
      await this.data.processRun(runId);
      await Promise.all([this.loadRun(runId), this.refreshRunsAndPending()]);
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to process payroll run.');
      return false;
    } finally {
      this.actionLoadingState.set(false);
    }
  }

  async finalizeRun(runId: string, reason: string): Promise<RebuildPayrollActionResult | null> {
    const normalized = reason.trim();
    if (!normalized) {
      this.errorState.set('A finalization reason is required.');
      return null;
    }

    this.actionLoadingState.set(true);
    this.clearError();
    try {
      const result = await this.data.finalizeRun(runId, normalized);
      await Promise.all([this.loadRun(runId), this.refreshRunsAndPending()]);
      return result;
    } catch (error: unknown) {
      this.setError(error, 'Unable to finalize payroll run.');
      return null;
    } finally {
      this.actionLoadingState.set(false);
    }
  }

  async deleteRun(runId: string, reason: string): Promise<RebuildPayrollActionResult | null> {
    const normalized = reason.trim();
    if (!normalized) {
      this.errorState.set('A deletion reason is required.');
      return null;
    }

    this.actionLoadingState.set(true);
    this.clearError();
    try {
      const result = await this.data.deleteRun(runId, normalized);
      await this.refreshRunsAndPending();
      if (result.mode === 'pending') {
        await this.loadRun(runId);
      } else {
        this.selectedRunState.set(null);
        this.runSlipsState.set([]);
      }
      return result;
    } catch (error: unknown) {
      this.setError(error, 'Unable to delete payroll run.');
      return null;
    } finally {
      this.actionLoadingState.set(false);
    }
  }

  async reviewSensitiveChange(input: PayrollSensitiveReviewInput): Promise<boolean> {
    if (input.decision === 'rejected' && !(input.rejectionReason?.trim().length)) {
      this.errorState.set('A rejection reason is required.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.reviewSensitiveChange(
        input.changeRequestId,
        input.decision,
        input.decision === 'rejected' ? input.rejectionReason?.trim() : undefined
      );
      this.pendingChangesState.set(await this.data.listPendingSensitiveChanges());
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to review sensitive payroll change.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async loadPayslip(slipId: string): Promise<PayslipLoadResult> {
    this.payslipLoadingState.set(true);
    this.clearError();
    this.selectedPayslipState.set(null);

    try {
      const slip = await this.data.getPayslip(slipId);
      if (!slip) {
        this.errorState.set('Payslip is unavailable. It may still be processing or you may not have access.');
        return 'unavailable';
      }
      this.selectedPayslipState.set(slip);
      return 'loaded';
    } catch (error: unknown) {
      if (error instanceof Error && error.message.toLowerCase().includes('unauthorized')) {
        this.errorState.set('You do not have permission to access this payslip.');
        return 'unauthorized';
      }
      this.setError(error, 'Unable to load payslip.');
      return 'error';
    } finally {
      this.payslipLoadingState.set(false);
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private async refreshRunsAndPending(): Promise<void> {
    const runs = await this.data.listRuns();
    this.runsState.set(runs);

    if (this.canReviewSensitiveChanges()) {
      this.pendingChangesState.set(await this.data.listPendingSensitiveChanges());
    } else {
      this.pendingChangesState.set([]);
    }
  }

  private setError(error: unknown, fallback: string): void {
    if (error instanceof Error && error.message.trim().length > 0) {
      this.errorState.set(error.message);
      return;
    }
    this.errorState.set(fallback);
  }

  private currentYear(): number {
    return new Date().getFullYear();
  }

  canRejectSensitiveChange(decision: PayrollReviewDecision): boolean {
    return decision === 'rejected';
  }
}
