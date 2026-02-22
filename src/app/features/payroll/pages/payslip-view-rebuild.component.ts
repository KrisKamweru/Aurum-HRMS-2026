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
  template: ''
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
