import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { api } from '../../../../convex/_generated/api';
import { ToastService } from '../../shared/services/toast.service';
import { Id } from '../../../../convex/_generated/dataModel';

@Component({
  selector: 'app-payroll-run',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UiButtonComponent,
    UiIconComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header / Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
        <a routerLink="/payroll" class="hover:text-burgundy-600 dark:hover:text-burgundy-400">Payroll</a>
        <ui-icon name="chevron-right" class="w-4 h-4"></ui-icon>
        <span class="text-stone-900 dark:text-white font-medium">Run Details</span>
      </div>

      @if (run(); as r) {
        <!-- Run Info Header -->
        <div class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <h1 class="text-2xl font-bold text-stone-900 dark:text-white">
                  {{ getMonthName(r.month) }} {{ r.year }}
                </h1>
                <span [class]="getStatusClasses(r.status)">
                  {{ r.status | titlecase }}
                </span>
              </div>
              <p class="text-stone-500 dark:text-stone-400">
                Created on {{ r.runDate | date:'mediumDate' }}
              </p>
            </div>

            <div class="flex items-center gap-3">
              @if (r.status !== 'completed') {
                <ui-button
                  variant="danger"
                  variant="outline"
                  (onClick)="deleteRun()"
                  [loading]="isDeleting"
                  icon="trash"
                >
                  Delete
                </ui-button>

                <ui-button
                  variant="primary"
                  (onClick)="processRun()"
                  [loading]="isProcessing"
                >
                  <ui-icon name="arrow-path" class="w-4 h-4 mr-2" [class.animate-spin]="isProcessing"></ui-icon>
                  {{ slips().length > 0 ? 'Re-calculate' : 'Calculate Payroll' }}
                </ui-button>

                @if (slips().length > 0) {
                  <ui-button
                    variant="gold"
                    (onClick)="finalizeRun()"
                    [loading]="isFinalizing"
                    [prerequisitesMet]="true"
                  >
                    <ui-icon name="badge-check" class="w-4 h-4 mr-2"></ui-icon>
                    Finalize & Lock
                  </ui-button>
                }
              } @else {
                <div class="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg flex items-center gap-2">
                  <ui-icon name="lock-closed" class="w-5 h-5"></ui-icon>
                  <span class="font-medium">Run Completed & Locked</span>
                </div>
              }
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-6 border-t border-stone-100 dark:border-stone-700">
            <div>
              <p class="text-sm text-stone-500 dark:text-stone-400 mb-1">Total Employees</p>
              <p class="text-2xl font-bold text-stone-900 dark:text-white">{{ r.employeeCount || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-stone-500 dark:text-stone-400 mb-1">Total Gross Pay</p>
              <p class="text-2xl font-bold text-stone-900 dark:text-white">{{ r.totalGrossPay || 0 | currency }}</p>
            </div>
            <div>
              <p class="text-sm text-stone-500 dark:text-stone-400 mb-1">Total Net Pay</p>
              <p class="text-2xl font-bold text-burgundy-600 dark:text-burgundy-400">{{ r.totalNetPay || 0 | currency }}</p>
            </div>
          </div>
        </div>

        <!-- Employee Slips List -->
        <div class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-stone-100 dark:border-stone-700 flex justify-between items-center">
            <h3 class="font-semibold text-lg text-stone-900 dark:text-white">Payslips</h3>
            <div class="text-sm text-stone-500">
              {{ slips().length }} records
            </div>
          </div>

          @if (slips().length > 0) {
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-stone-200 dark:divide-stone-700">
                <thead class="bg-stone-50 dark:bg-stone-900/50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Employee</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Department</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Basic</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Gross</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Net Pay</th>
                    <th scope="col" class="relative px-6 py-3"><span class="sr-only">View</span></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-stone-200 dark:divide-stone-700">
                  @for (slip of slips(); track slip._id) {
                    <tr class="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="font-medium text-stone-900 dark:text-white">{{ slip.employeeName }}</div>
                        <div class="text-xs text-stone-500">{{ slip.designation || 'No Designation' }}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-stone-400">
                        {{ slip.department || '-' }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-stone-400">
                        {{ slip.basicSalary | currency }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-stone-400">
                        {{ slip.grossSalary | currency }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-burgundy-700 dark:text-burgundy-300">
                        {{ slip.netSalary | currency }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          (click)="viewPayslip(slip._id)"
                          class="text-burgundy-600 dark:text-burgundy-400 hover:text-burgundy-900 dark:hover:text-burgundy-300 font-medium"
                        >
                          View Slip
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="p-12 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 mb-4">
                <ui-icon name="calculator" class="w-8 h-8 text-stone-400"></ui-icon>
              </div>
              <h3 class="text-lg font-medium text-stone-900 dark:text-white mb-2">No payroll data calculated yet</h3>
              <p class="text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-6">
                Click "Calculate Payroll" to process salaries for all active employees based on their configured salary and active adjustments.
              </p>
              @if (r.status !== 'completed') {
                <ui-button (onClick)="processRun()" [loading]="isProcessing">
                  Calculate Now
                </ui-button>
              }
            </div>
          }
        </div>
      } @else {
        <div class="flex items-center justify-center h-64">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy-600"></div>
        </div>
      }
    </div>
  `
})
export class PayrollRunComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);

  runId = signal<Id<"payroll_runs"> | null>(null);
  run = signal<any>(null);
  slips = signal<any[]>([]);

  isProcessing = false;
  isFinalizing = false;
  isDeleting = false;

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        const id = params['id'] as Id<"payroll_runs">;
        this.runId.set(id);
        this.loadData(id);
      }
    });
  }

  loadData(id: Id<"payroll_runs">) {
    const client = this.convex.getClient();

    // Subscribe to Run Details
    client.onUpdate(api.payroll.getRun, { id }, (run) => {
      this.run.set(run);
      if (!run) {
        this.toast.error('Payroll run not found');
        this.router.navigate(['/payroll']);
      }
    });

    // Subscribe to Slips
    client.onUpdate(api.payroll.getRunSlips, { runId: id }, (slips) => {
      this.slips.set(slips);
    });
  }

  async processRun() {
    if (!this.runId()) return;

    this.isProcessing = true;
    try {
      await this.convex.getClient().mutation(api.payroll.processRun, { runId: this.runId()! });
      this.toast.success('Payroll calculated successfully');
    } catch (error: any) {
      console.error('Processing error:', error);
      this.toast.error(error.message || 'Failed to calculate payroll');
    } finally {
      this.isProcessing = false;
    }
  }

  async finalizeRun() {
    if (!this.runId()) return;
    if (!confirm('Are you sure you want to finalize this payroll run? This action cannot be undone and will lock all records.')) {
      return;
    }

    this.isFinalizing = true;
    try {
      await this.convex.getClient().mutation(api.payroll.finalizeRun, { runId: this.runId()! });
      this.toast.success('Payroll run finalized and locked');
    } catch (error: any) {
      this.toast.error(error.message || 'Failed to finalize run');
    } finally {
      this.isFinalizing = false;
    }
  }

  async deleteRun() {
    if (!this.runId()) return;
    if (!confirm('Are you sure you want to delete this payroll run? All generated slips will be removed.')) {
      return;
    }

    this.isDeleting = true;
    try {
      await this.convex.getClient().mutation(api.payroll.deleteRun, { runId: this.runId()! });
      this.toast.success('Payroll run deleted');
      this.router.navigate(['/payroll']);
    } catch (error: any) {
      this.toast.error(error.message || 'Failed to delete run');
    } finally {
      this.isDeleting = false;
    }
  }

  viewPayslip(id: string) {
    this.router.navigate(['/payroll/slip', id]);
  }

  getMonthName(month: number): string {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
  }

  getStatusClasses(status: string): string {
    const base = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'completed':
        return `${base} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`;
      case 'processing':
        return `${base} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`;
      case 'draft':
      default:
        return `${base} bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-300`;
    }
  }
}
