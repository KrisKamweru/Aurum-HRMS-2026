import { DatePipe, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { PayrollRunStatus } from '../data/payroll-rebuild.models';
import { PayrollRebuildStore } from '../data/payroll-rebuild.store';

type PayrollAction = 'finalize' | 'delete';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-payroll-run-rebuild',
  imports: [DatePipe, CurrencyPipe, UiBadgeComponent, UiButtonComponent, UiConfirmDialogComponent],
  template: ''
})
export class PayrollRunRebuildComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(PayrollRebuildStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly run = this.store.selectedRun;
  readonly runSlips = this.store.runSlips;
  readonly hasRunSlips = this.store.hasRunSlips;
  readonly isDetailLoading = this.store.isDetailLoading;
  readonly isActionLoading = this.store.isActionLoading;
  readonly error = this.store.error;

  readonly routeError = signal<string | null>(null);
  readonly currentRunId = signal<string | null>(null);

  readonly isActionDialogOpen = signal(false);
  readonly pendingAction = signal<PayrollAction | null>(null);

  readonly actionDialogOptions = computed<ConfirmDialogOptions>(() => {
    if (this.pendingAction() === 'delete') {
      return {
        title: 'Delete Payroll Run',
        message: 'Delete this payroll run and all generated slips? This action is irreversible.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger',
        reasonRequired: true,
        reasonLabel: 'Deletion reason',
        reasonPlaceholder: 'Explain why this run should be deleted'
      };
    }

    return {
      title: 'Finalize Payroll Run',
      message: 'Finalize this run and lock it as the official payroll output?',
      confirmText: 'Finalize',
      cancelText: 'Cancel',
      variant: 'warning',
      reasonRequired: true,
      reasonLabel: 'Finalization reason',
      reasonPlaceholder: 'Explain why this run is ready to finalize'
    };
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id')?.trim() ?? '';
      if (!id) {
        this.currentRunId.set(null);
        this.routeError.set('Payroll route is missing a run id parameter.');
        return;
      }

      this.routeError.set(null);
      this.currentRunId.set(id);
      void this.store.loadRun(id);
    });
  }

  goToPayrollList(): void {
    void this.router.navigate(['/payroll']);
  }

  reloadRun(): void {
    const runId = this.currentRunId();
    if (!runId) {
      return;
    }
    void this.store.loadRun(runId);
  }

  async processRun(): Promise<void> {
    const runId = this.currentRunId();
    if (!runId) {
      return;
    }
    await this.store.processRun(runId);
  }

  requestAction(action: PayrollAction): void {
    this.pendingAction.set(action);
    this.isActionDialogOpen.set(true);
    this.store.clearError();
  }

  async confirmAction(reason: string): Promise<void> {
    const runId = this.currentRunId();
    const action = this.pendingAction();
    if (!runId || !action) {
      return;
    }

    if (action === 'finalize') {
      const result = await this.store.finalizeRun(runId, reason);
      if (result) {
        this.pendingAction.set(null);
        this.isActionDialogOpen.set(false);
      }
      return;
    }

    const result = await this.store.deleteRun(runId, reason);
    if (!result) {
      return;
    }

    this.pendingAction.set(null);
    this.isActionDialogOpen.set(false);
    if (result.mode === 'applied') {
      await this.router.navigate(['/payroll']);
    }
  }

  viewPayslip(slipId: string): void {
    void this.router.navigate(['/payroll/slip', slipId]);
  }

  statusVariant(status: PayrollRunStatus): BadgeVariant {
    if (status === 'completed') {
      return 'success';
    }
    if (status === 'processing') {
      return 'info';
    }
    return 'neutral';
  }

  periodLabel(month: number, year: number): string {
    return `${this.getMonthName(month)} ${year}`;
  }

  private getMonthName(month: number): string {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
  }
}
