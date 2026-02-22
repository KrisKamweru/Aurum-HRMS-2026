import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { PayrollRebuildStore } from '../data/payroll-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-payslip-view-rebuild',
  host: {
    class: 'block'
  },
  imports: [CurrencyPipe, UiButtonComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto flex max-w-4xl flex-col gap-6">
        <section class="flex items-center justify-between print:hidden">
          <ui-button variant="outline" size="sm" (onClick)="goBack()">Back</ui-button>
          @if (payslip()) {
            <ui-button variant="secondary" size="sm" (onClick)="printSlip()">Print / Download PDF</ui-button>
          }
        </section>

        @if (routeError()) {
          <section class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
            {{ routeError() }}
          </section>
        }

        @if (isPayslipLoading()) {
          <section class="flex min-h-64 items-center justify-center rounded-2xl border border-stone-200 bg-white dark:border-white/8 dark:bg-white/[0.04]">
            <div class="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-burgundy-700 dark:border-white/15 dark:border-t-burgundy-300"></div>
          </section>
        } @else if (error()) {
          <section class="min-h-64 rounded-2xl border border-stone-200 bg-white p-6 text-center dark:border-white/8 dark:bg-white/[0.04]">
            <div class="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-burgundy-700/20 text-xs font-bold text-burgundy-700 dark:text-burgundy-300">!</div>
            <h2 class="text-base font-semibold text-stone-900 dark:text-stone-100">Payslip Unavailable</h2>
            <p class="mt-2 text-sm text-stone-600 dark:text-stone-400">{{ error() }}</p>
            <ui-button class="mt-4" variant="outline" size="sm" (onClick)="goBack()">Back to Dashboard</ui-button>
          </section>
        } @else if (payslip()) {
          <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04] print:border-stone-300 print:shadow-none">
            <div class="bg-burgundy-700 px-5 py-2.5 text-xs font-bold tracking-[0.2em] text-white">SALARY SLIP</div>

            <div class="flex items-center justify-between gap-2 border-b border-stone-200 px-5 py-2 text-xs text-stone-500 dark:border-white/8 dark:text-stone-400">
              <span>{{ getMonthName(payslip()!.month) }} {{ payslip()!.year }}</span>
              <span>Aurum HRMS</span>
            </div>

            <div class="flex items-center gap-3 border-b border-stone-200 px-5 py-4 dark:border-white/8">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-burgundy-700/20 text-xs font-bold text-burgundy-700 dark:text-burgundy-300">
                {{ getInitials(payslip()!.employeeName) }}
              </span>
              <div>
                <p class="text-sm font-semibold text-stone-900 dark:text-stone-100 print:text-black">{{ payslip()!.employeeName }}</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">{{ payslip()!.designation || 'Staff' }} • {{ payslip()!.department || 'N/A' }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2">
              <div class="px-5 py-4 sm:border-r sm:border-stone-200 dark:sm:border-white/8">
                <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">Earnings</p>
                @for (item of payslip()!.earnings; track item.name) {
                  <div class="flex items-center justify-between py-1 text-xs text-stone-600 dark:text-stone-300 print:text-stone-700">
                    <span>{{ item.name }}</span>
                    <span>{{ item.amount | currency }}</span>
                  </div>
                }
                @if (payslip()!.earnings.length === 0) {
                  <div class="flex items-center justify-between py-1 text-xs italic text-stone-400 dark:text-stone-500">
                    <span>No earnings</span>
                    <span>--</span>
                  </div>
                }
                <div class="mt-2 flex items-center justify-between border-t border-stone-200 pt-2 text-xs font-bold text-stone-900 dark:border-white/8 dark:text-stone-100 print:text-black">
                  <span>Gross Pay</span>
                  <span>{{ payslip()!.grossSalary | currency }}</span>
                </div>
              </div>

              <div class="border-t border-stone-200 px-5 py-4 dark:border-white/8 sm:border-t-0">
                <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">Deductions</p>
                @for (item of payslip()!.deductions; track item.name) {
                  <div class="flex items-center justify-between py-1 text-xs text-stone-600 dark:text-stone-300 print:text-stone-700">
                    <span>{{ item.name }}</span>
                    <span>{{ item.amount | currency }}</span>
                  </div>
                }
                @if (payslip()!.deductions.length === 0) {
                  <div class="flex items-center justify-between py-1 text-xs italic text-stone-400 dark:text-stone-500">
                    <span>No deductions</span>
                    <span>--</span>
                  </div>
                }
                <div class="mt-2 flex items-center justify-between border-t border-stone-200 pt-2 text-xs font-bold text-stone-900 dark:border-white/8 dark:text-stone-100 print:text-black">
                  <span>Net Pay</span>
                  <span>{{ payslip()!.netSalary | currency }}</span>
                </div>
              </div>
            </div>

            @if (payslip()!.employerContributions.length > 0) {
              <div class="border-t border-stone-200 bg-stone-50/60 px-5 py-4 dark:border-white/8 dark:bg-white/[0.02]">
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span class="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">Employer Contributions</span>
                  <span class="text-xs italic text-stone-500 dark:text-stone-400">Paid by company, not deducted from salary</span>
                </div>
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  @for (item of payslip()!.employerContributions; track item.name) {
                    <div class="flex items-center justify-between py-1 text-xs text-stone-600 dark:text-stone-300 print:text-stone-700">
                      <span>{{ item.name }}</span>
                      <span>{{ item.amount | currency }}</span>
                    </div>
                  }
                  <div class="flex items-center justify-between border-t border-stone-200 pt-2 text-xs font-bold text-stone-900 dark:border-white/8 dark:text-stone-100 print:text-black">
                    <span>Total CTC</span>
                    <span>{{ payslip()!.grossSalary + totalEmployerContributions() | currency }}</span>
                  </div>
                </div>
              </div>
            }

            <div class="flex flex-col gap-4 border-t border-stone-200 bg-stone-50/60 px-5 py-4 dark:border-white/8 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
              <div class="text-xs text-stone-500 dark:text-stone-400">
                <p>Payment Method: Bank Transfer</p>
                <p class="italic">This is a computer generated document and does not require a signature.</p>
              </div>
              <div class="text-left sm:text-right">
                <p class="m-0 text-xs text-stone-500 dark:text-stone-400">Net Payable Amount</p>
                <p class="m-0 text-2xl font-bold text-stone-900 dark:text-stone-100 print:text-black">{{ payslip()!.netSalary | currency }}</p>
              </div>
            </div>
          </section>
        }
      </div>
    </main>
  `
})
export class PayslipViewRebuildComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(PayrollRebuildStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly payslip = this.store.selectedPayslip;
  readonly isPayslipLoading = this.store.isPayslipLoading;
  readonly error = this.store.error;
  readonly routeError = signal<string | null>(null);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id')?.trim() ?? '';
      if (!id) {
        this.routeError.set('Payslip route is missing an id parameter.');
        return;
      }

      this.routeError.set(null);
      void this.loadPayslip(id);
    });
  }

  goBack(): void {
    const runId = this.payslip()?.runId;
    if (runId) {
      void this.router.navigate(['/payroll', runId]);
      return;
    }
    void this.router.navigate(['/dashboard']);
  }

  printSlip(): void {
    window.print();
  }

  getMonthName(month: number | undefined): string {
    if (!month || month < 1 || month > 12) {
      return '';
    }
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
  }

  getInitials(name: string): string {
    const normalized = name.trim();
    if (!normalized) {
      return '??';
    }

    const parts = normalized.split(/\s+/).filter((part) => part.length > 0);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return normalized.slice(0, 2).toUpperCase();
  }

  totalEmployerContributions(): number {
    return this.payslip()?.employerContributions.reduce((sum, item) => sum + item.amount, 0) ?? 0;
  }

  private async loadPayslip(slipId: string): Promise<void> {
    const result = await this.store.loadPayslip(slipId);
    if (result === 'unauthorized') {
      await this.router.navigate(['/dashboard']);
    }
  }
}
