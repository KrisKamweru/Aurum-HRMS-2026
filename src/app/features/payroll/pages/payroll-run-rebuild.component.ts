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
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <ui-button variant="outline" size="sm" (onClick)="goToPayrollList()">Back to Payroll</ui-button>
        @if (run()) {
          <p class="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">Run ID: {{ run()!.id }}</p>
        }
      </section>

      @if (routeError()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          {{ routeError() }}
        </section>
      }

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" [disabled]="isDetailLoading()" (onClick)="reloadRun()">Retry</ui-button>
        </section>
      }

      @if (isDetailLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-5 w-52 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-32 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else if (run()) {
        <section class="mb-6 rounded-2xl border border-white/[0.55] bg-white/[0.82] p-6 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.05]">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ periodLabel(run()!.month, run()!.year) }}</h1>
                <ui-badge size="sm" [rounded]="true" [variant]="statusVariant(run()!.status)">{{ run()!.status }}</ui-badge>
              </div>
              <p class="text-sm text-stone-600 dark:text-stone-400">Created {{ run()!.runDate | date: 'MMM d, y' }}</p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              @if (run()!.status !== 'completed') {
                <ui-button variant="danger" size="sm" [disabled]="isActionLoading()" (onClick)="requestAction('delete')">Delete</ui-button>
                <ui-button variant="primary" size="sm" [disabled]="isActionLoading()" (onClick)="processRun()">{{ hasRunSlips() ? 'Re-calculate' : 'Calculate Payroll' }}</ui-button>
                @if (hasRunSlips()) {
                  <ui-button variant="gold" size="sm" [disabled]="isActionLoading()" (onClick)="requestAction('finalize')">Finalize & Lock</ui-button>
                }
              } @else {
                <ui-badge size="sm" [rounded]="true" variant="success">Run Completed & Locked</ui-badge>
              }
            </div>
          </div>

          <div class="mt-5 grid gap-4 md:grid-cols-3">
            <article class="rounded-xl border border-stone-200 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.03]">
              <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Employees</p>
              <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ run()!.employeeCount }}</p>
            </article>
            <article class="rounded-xl border border-stone-200 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.03]">
              <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Gross Pay</p>
              <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ run()!.totalGrossPay | currency }}</p>
            </article>
            <article class="rounded-xl border border-stone-200 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.03]">
              <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Net Pay</p>
              <p class="mt-1 text-2xl font-semibold text-burgundy-700 dark:text-burgundy-300">{{ run()!.totalNetPay | currency }}</p>
            </article>
          </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="border-b border-stone-200 px-4 py-3 dark:border-white/8">
            <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Run Payslips</p>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-[#eeedf0] text-xs font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.02] dark:text-stone-400">
                <tr>
                  <th class="px-4 py-3">Employee</th>
                  <th class="px-4 py-3">Department</th>
                  <th class="px-4 py-3">Basic</th>
                  <th class="px-4 py-3">Gross</th>
                  <th class="px-4 py-3">Net</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (runSlips().length === 0) {
                  <tr>
                    <td colspan="6" class="px-4 py-5 text-center text-stone-500 dark:text-stone-400">No payslips yet. Run payroll to generate slips.</td>
                  </tr>
                } @else {
                  @for (slip of runSlips(); track slip.id) {
                    <tr class="border-t border-stone-100 dark:border-white/[0.03]">
                      <td class="px-4 py-3">
                        <p class="font-semibold text-stone-800 dark:text-stone-100">{{ slip.employeeName }}</p>
                        <p class="text-xs text-stone-500 dark:text-stone-400">{{ slip.designation || 'Unassigned' }}</p>
                      </td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ slip.department || 'Unassigned' }}</td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ slip.basicSalary | currency }}</td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ slip.grossSalary | currency }}</td>
                      <td class="px-4 py-3 font-semibold text-burgundy-700 dark:text-burgundy-300">{{ slip.netSalary | currency }}</td>
                      <td class="px-4 py-3 text-right">
                        <ui-button size="sm" variant="secondary" (onClick)="viewPayslip(slip.id)">View Slip</ui-button>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      <ui-confirm-dialog
        [isOpen]="isActionDialogOpen()"
        (isOpenChange)="isActionDialogOpen.set($event)"
        [options]="actionDialogOptions()"
        (confirm)="confirmAction($event)"
      />
    </main>
  `
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
