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
  imports: [
    CommonModule,
    RouterModule,
    UiButtonComponent,
    UiIconComponent
  ],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto print:max-w-none print:mx-0">
      <!-- Header Actions (Hidden in Print) -->
      <div class="flex items-center justify-between print:hidden">
        <button
          (click)="goBack()"
          class="flex items-center text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
        >
          <ui-icon name="arrow-left" class="w-4 h-4 mr-2"></ui-icon>
          Back
        </button>

        <ui-button variant="outline" (onClick)="printSlip()">
          <ui-icon name="printer" class="w-4 h-4 mr-2"></ui-icon>
          Print / Download PDF
        </ui-button>
      </div>

      @if (slip(); as s) {
        <div class="bg-white text-stone-900 rounded-none sm:rounded-2xl shadow-sm border border-stone-200 overflow-hidden print:shadow-none print:border-none print:p-0">

          <!-- Slip Header -->
          <div class="p-8 border-b border-stone-100 flex justify-between items-start bg-stone-50/50 print:bg-white">
            <div class="flex items-center gap-4">
              <!-- Logo Placeholder -->
              <div class="w-16 h-16 bg-burgundy-900 text-white flex items-center justify-center rounded-xl font-bold text-2xl print:text-black print:border print:border-black print:bg-transparent">
                A
              </div>
              <div>
                <h1 class="text-2xl font-bold text-burgundy-900 print:text-black">Aurum HRMS</h1>
                <p class="text-sm text-stone-500 print:text-stone-700">123 Business Park, Tech City</p>
                <p class="text-sm text-stone-500 print:text-stone-700">contact@aurum.com</p>
              </div>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold text-stone-900">Payslip</h2>
              <p class="text-burgundy-700 font-medium print:text-black">
                {{ getMonthName(s.month) }} {{ s.year }}
              </p>
              <p class="text-sm text-stone-500 mt-1">Generated: {{ s.generatedAt | date:'mediumDate' }}</p>
            </div>
          </div>

          <!-- Employee Details -->
          <div class="p-8 border-b border-stone-100 grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p class="text-stone-500 mb-1">Employee Name</p>
              <p class="font-bold text-lg">{{ s.employeeName }}</p>
            </div>
            <div>
              <p class="text-stone-500 mb-1">Designation</p>
              <p class="font-medium">{{ s.designation || '-' }}</p>
            </div>
            <div>
              <p class="text-stone-500 mb-1">Department</p>
              <p class="font-medium">{{ s.department || '-' }}</p>
            </div>
            <div>
              <p class="text-stone-500 mb-1">Date of Joining</p>
              <p class="font-medium">{{ s.joinDate | date:'mediumDate' }}</p>
            </div>
          </div>

          <!-- Earnings & Deductions -->
          <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-100 print:grid-cols-2 print:divide-x">
            <!-- Earnings -->
            <div class="p-8">
              <h3 class="font-bold text-stone-900 mb-4 uppercase text-xs tracking-wider">Earnings</h3>
              <div class="space-y-3">
                @for (item of s.earnings; track item.name) {
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-stone-600">{{ item.name }}</span>
                    <span class="font-medium">{{ item.amount | currency }}</span>
                  </div>
                }
                <!-- Pad empty space if needed -->
                @if (s.earnings.length === 0) {
                  <div class="text-stone-400 italic text-sm">No earnings records</div>
                }
              </div>
              <div class="mt-8 pt-4 border-t border-stone-100 flex justify-between items-center">
                <span class="font-bold text-stone-900">Total Earnings</span>
                <span class="font-bold text-stone-900">{{ s.grossSalary | currency }}</span>
              </div>
            </div>

            <!-- Deductions -->
            <div class="p-8">
              <h3 class="font-bold text-stone-900 mb-4 uppercase text-xs tracking-wider">Deductions</h3>
              <div class="space-y-3">
                @for (item of s.deductions; track item.name) {
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-stone-600">{{ item.name }}</span>
                    <span class="font-medium text-red-600 print:text-black">-{{ item.amount | currency }}</span>
                  </div>
                }
                 @if (s.deductions.length === 0) {
                  <div class="text-stone-400 italic text-sm">No deductions</div>
                }
              </div>
              <div class="mt-8 pt-4 border-t border-stone-100 flex justify-between items-center">
                <span class="font-bold text-stone-900">Total Deductions</span>
                <span class="font-bold text-red-600 print:text-black">-{{ calculateTotalDeductions(s) | currency }}</span>
              </div>
            </div>
          </div>

          <!-- Employer Contributions (Statutory) -->
          @if (s.employerContributions?.length) {
            <div class="px-8 py-6 bg-stone-50/50 border-t border-stone-100 print:bg-transparent print:border-stone-200">
              <div class="flex items-center gap-2 mb-4">
                <h3 class="font-bold text-stone-700 uppercase text-xs tracking-wider">Employer Contributions (Statutory)</h3>
                <div class="group relative flex items-center">
                  <ui-icon name="information-circle" class="w-4 h-4 text-stone-400 cursor-help"></ui-icon>
                  <div class="absolute left-full ml-2 px-2 py-1 bg-stone-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 print:hidden">
                    Paid by company, not deducted from salary
                  </div>
                </div>
                <span class="text-xs text-stone-500 font-normal hidden sm:inline print:inline italic">- Paid by company, not deducted from salary</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                <div class="space-y-3">
                  @for (item of s.employerContributions; track item.name) {
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-stone-600">{{ item.name }}</span>
                      <span class="font-medium text-stone-700">{{ item.amount | currency }}</span>
                    </div>
                  }
                </div>

                <div class="md:border-l md:border-stone-200 md:pl-8 flex flex-col justify-end">
                   <div class="flex justify-between items-center text-sm pt-2 md:pt-0">
                      <span class="font-medium text-stone-700">Total Employer Contribution</span>
                      <span class="font-bold text-stone-700">{{ calculateTotalEmployerContributions(s) | currency }}</span>
                   </div>
                   <div class="mt-2 pt-2 border-t border-stone-200 flex justify-between items-center text-sm">
                      <span class="font-bold text-stone-900">Total Cost to Company (CTC)</span>
                      <span class="font-bold text-burgundy-700">{{ (s.grossSalary + calculateTotalEmployerContributions(s)) | currency }}</span>
                   </div>
                </div>
              </div>
            </div>
          }

          <!-- Net Pay -->
          <div class="p-8 bg-stone-50 print:bg-white print:border-t border-t border-stone-100">
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div class="text-sm text-stone-500">
                <p>Payment Method: Bank Transfer</p>
                <p>** This is a computer generated document and does not require a signature.</p>
              </div>
              <div class="text-right">
                <p class="text-stone-500 text-sm mb-1">Net Payable Amount</p>
                <p class="text-3xl font-bold text-burgundy-700 print:text-black">{{ s.netSalary | currency }}</p>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="flex items-center justify-center h-64">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy-600"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    @media print {
      @page {
        margin: 0;
        size: A4;
      }
      :host {
        display: block;
        width: 100%;
        height: 100%;
        background: white;
      }
      /* Hide browser default headers/footers if possible, though mostly user-controlled */
    }
  `]
})
export class PayslipViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);

  slipId = signal<Id<"salary_slips"> | null>(null);
  slip = signal<any>(null);

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
    client.onUpdate(api.payroll.getPayslip, { slipId: id }, (data) => {
      this.slip.set(data);
      if (!data) {
        this.toast.error('Payslip not found or unauthorized');
        this.goBack();
      }
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
       this.router.navigate(['/payroll']);
    }
  }

  printSlip() {
    window.print();
  }
}
