import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-payslip-view',
  standalone: true,
  host: {
    class: 'block'
  },
  imports: [
    CommonModule,
    RouterModule,
    UiButtonComponent,
    UiIconComponent
  ],
  template: `
    <div class="mx-auto flex max-w-4xl flex-col gap-6">
      <!-- Header Actions (Hidden in Print) -->
      <div class="flex items-center justify-between print:hidden">
        <button
          (click)="goBack()"
          class="inline-flex items-center rounded-lg px-2 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
        >
          <ui-icon name="arrow-left" class="w-4 h-4 mr-2"></ui-icon>
          Back
        </button>

        @if (slip()) {
          <ui-button variant="outline" (onClick)="printSlip()">
            <ui-icon name="printer" class="w-4 h-4 mr-2"></ui-icon>
            Print / Download PDF
          </ui-button>
        }
      </div>

      @if (loading()) {
        <div class="flex min-h-64 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 dark:border-white/15 border-t-burgundy-700"></div>
        </div>
      } @else if (loadError(); as err) {
        <div class="min-h-64 rounded-2xl border border-stone-200 dark:border-white/8 bg-white dark:bg-white/5 dark:backdrop-blur-xl p-6 flex flex-col items-center justify-center gap-3 text-center">
          <div class="h-8 w-8 rounded-full bg-burgundy-700/20 text-burgundy-600 dark:text-burgundy-300 font-bold flex items-center justify-center">!</div>
          <h3 class="m-0 text-base font-semibold text-stone-900 dark:text-stone-100">Payslip Unavailable</h3>
          <p class="m-0 max-w-xl text-sm text-stone-500 dark:text-stone-400">{{ err }}</p>
          <ui-button variant="outline" (onClick)="goBack()">Back to Dashboard</ui-button>
        </div>
      } @else if (slip(); as s) {
        <!-- Payslip Card - Design Six Pattern -->
        <div class="overflow-hidden rounded-2xl border border-stone-200 dark:border-white/8 bg-white shadow-sm dark:bg-white/5 dark:backdrop-blur-xl print:border-stone-300 print:shadow-none">
          <!-- Banner Header -->
          <div class="bg-burgundy-700 px-5 py-2.5 text-xs font-bold tracking-[0.2em] text-white">SALARY SLIP</div>

          <!-- Meta Row -->
          <div class="flex items-center justify-between gap-2 border-b border-stone-200 dark:border-white/8 px-5 py-2 text-xs text-stone-500 dark:text-stone-400">
            <span>{{ getMonthName(s.month) }} {{ s.year }}</span>
            <span>Aurum HRMS</span>
          </div>

          <!-- Employee Section -->
          <div class="flex items-center gap-3 border-b border-stone-200 dark:border-white/8 px-5 py-4">
            <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-burgundy-700/20 text-xs font-bold text-burgundy-700 dark:text-burgundy-300">{{ getInitials(s.employeeName) }}</span>
            <div>
              <div class="text-sm font-semibold text-stone-900 dark:text-stone-100 print:text-black">{{ s.employeeName }}</div>
              <div class="text-xs text-stone-500 dark:text-stone-400">{{ s.designation || 'Staff' }} &middot; {{ s.department || 'N/A' }}</div>
            </div>
          </div>

          <!-- Two Column Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2">
            <!-- Earnings Column -->
            <div class="px-5 py-4 sm:border-r border-stone-200 dark:border-white/8">
              <div class="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">Earnings</div>
              @for (item of s.earnings; track item.name) {
                <div class="flex items-center justify-between py-1 text-xs text-stone-600 dark:text-stone-300 print:text-stone-700">
                  <span>{{ item.name }}</span>
                  <span>{{ item.amount | currency }}</span>
                </div>
              }
              @if (s.earnings.length === 0) {
                <div class="flex items-center justify-between py-1 text-xs italic text-stone-400 dark:text-stone-500">
                  <span>No earnings</span>
                  <span>--</span>
                </div>
              }
              <div class="mt-2 flex items-center justify-between border-t border-stone-200 dark:border-white/8 pt-2 text-xs font-bold text-stone-900 dark:text-stone-100 print:text-black">
                <span>Gross Pay</span>
                <span>{{ s.grossSalary | currency }}</span>
              </div>
            </div>

            <!-- Deductions Column -->
            <div class="px-5 py-4 border-t sm:border-t-0 border-stone-200 dark:border-white/8">
              <div class="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">Deductions</div>
              @for (item of s.deductions; track item.name) {
                <div class="flex items-center justify-between py-1 text-xs text-stone-600 dark:text-stone-300 print:text-stone-700">
                  <span>{{ item.name }}</span>
                  <span>{{ item.amount | currency }}</span>
                </div>
              }
              @if (s.deductions.length === 0) {
                <div class="flex items-center justify-between py-1 text-xs italic text-stone-400 dark:text-stone-500">
                  <span>No deductions</span>
                  <span>--</span>
                </div>
              }
              <div class="mt-2 flex items-center justify-between border-t border-stone-200 dark:border-white/8 pt-2 text-xs font-bold text-stone-900 dark:text-stone-100 print:text-black">
                <span>Net Pay</span>
                <span>{{ s.netSalary | currency }}</span>
              </div>
            </div>
          </div>

          <!-- Employer Contributions Section -->
          @if (s.employerContributions?.length) {
            <div class="border-t border-stone-200 dark:border-white/8 bg-stone-50/60 dark:bg-white/[0.02] px-5 py-4">
              <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span class="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">Employer Contributions</span>
                <span class="text-xs italic text-stone-500 dark:text-stone-400">Paid by company, not deducted from salary</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                @for (item of s.employerContributions; track item.name) {
                  <div class="flex items-center justify-between py-1 text-xs text-stone-600 dark:text-stone-300 print:text-stone-700">
                    <span>{{ item.name }}</span>
                    <span>{{ item.amount | currency }}</span>
                  </div>
                }
                <div class="flex items-center justify-between border-t border-stone-200 dark:border-white/8 pt-2 text-xs font-bold text-stone-900 dark:text-stone-100 print:text-black">
                  <span>Total CTC</span>
                  <span>{{ (s.grossSalary + calculateTotalEmployerContributions(s)) | currency }}</span>
                </div>
              </div>
            </div>
          }

          <!-- Footer -->
          <div class="flex flex-col gap-4 border-t border-stone-200 dark:border-white/8 bg-stone-50/60 dark:bg-white/[0.02] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-xs text-stone-500 dark:text-stone-400">
              <p>Payment Method: Bank Transfer</p>
              <p class="italic">** This is a computer generated document and does not require a signature.</p>
            </div>
            <div class="text-left sm:text-right">
              <p class="m-0 text-xs text-stone-500 dark:text-stone-400">Net Payable Amount</p>
              <p class="m-0 text-2xl font-bold text-stone-900 dark:text-stone-100 print:text-black">{{ s.netSalary | currency }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PayslipViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);

  slipId = signal<Id<"salary_slips"> | null>(null);
  slip = signal<any>(null);
  loading = signal(true);
  loadError = signal<string | null>(null);

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        const id = params['id'] as Id<"salary_slips">;
        this.slipId.set(id);
        this.loadSlip(id);
      }
    });
  }

  loadSlip(id: Id<"salary_slips">) {
    const client = this.convex.getClient();
    this.loading.set(true);
    this.loadError.set(null);
    this.slip.set(null);

    // Perform an immediate auth check/read first.
    client.query(api.payroll.getPayslip, { slipId: id })
      .then((data) => {
        if (!data) {
          this.loadError.set('Payslip is unavailable. It may still be processing or you may not have access.');
          this.loading.set(false);
          return;
        }
        this.slip.set(data);
        this.loading.set(false);
      })
      .catch((err: any) => {
        const message = String(err?.message || '');
        if (message.toLowerCase().includes('unauthorized')) {
          this.toast.error('You do not have permission to access this payslip.');
          this.router.navigate(['/dashboard']);
          return;
        }
        this.loadError.set('Payslip is unavailable. It may still be processing or you may not have access.');
        this.loading.set(false);
      });

    // Keep subscription for live updates once initial access is validated.
    client.onUpdate(api.payroll.getPayslip, { slipId: id }, (data) => {
      if (!data) return;
      this.slip.set(data);
      this.loadError.set(null);
      this.loading.set(false);
    });
  }

  calculateTotalDeductions(slip: any): number {
    return slip.deductions.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
  }

  calculateTotalEmployerContributions(slip: any): number {
    return slip.employerContributions?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
  }

  getMonthName(month: number): string {
    if (!month) return '';
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  goBack() {
    // If we have history state, go back, else go to payroll root
    // But since Angular router doesn't expose history length easily, let's just use logic
    // If the user came from run view, go back there.
    // For now, if we have a runId on the slip, we could go to it, but standard 'Back' is usually safer for UX flow if deep linked.
    // However, window.history.back() can exit the app if it's the first page.
    // Safe default:
    if (this.slip()?.runId) {
      this.router.navigate(['/payroll', this.slip().runId]);
    } else {
      // Avoid sending non-privileged users to a guarded payroll root.
      this.router.navigate(['/dashboard']);
    }
  }

  printSlip() {
    window.print();
  }
}
