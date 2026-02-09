import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiGridTileComponent } from '../../shared/components/ui-grid/ui-grid-tile.component';
import { UiGridComponent } from '../../shared/components/ui-grid/ui-grid.component';
import { UiDataTableComponent, TableColumn } from '../../shared/components/ui-data-table/ui-data-table.component';
import { api } from '../../../../convex/_generated/api';
import { ToastService } from '../../shared/services/toast.service';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { Id } from '../../../../convex/_generated/dataModel';

@Component({
  selector: 'app-payroll-run',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UiButtonComponent,
    UiIconComponent,
    UiGridTileComponent,
    UiGridComponent,
    UiDataTableComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
        <a routerLink="/payroll" class="text-stone-500 transition-colors hover:text-burgundy-700 dark:hover:text-rose-300">Payroll</a>
        <ui-icon name="chevron-right" class="w-4 h-4"></ui-icon>
        <span class="font-medium text-stone-900 dark:text-stone-100">Run Details</span>
      </div>

      @if (run(); as r) {
        <!-- Run Info Header - Glass Container -->
        <div class="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-700/60 dark:bg-stone-800/60 dark:shadow-none">
          <div class="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div class="mb-2 flex flex-wrap items-center gap-3">
                <h1 class="text-2xl font-semibold text-stone-900 dark:text-stone-50">
                  {{ getMonthName(r.month) }} {{ r.year }}
                </h1>
                <span [class]="getStatusClasses(r.status)">
                  {{ r.status | titlecase }}
                </span>
              </div>
              <p class="text-sm text-stone-500 dark:text-stone-400">
                Created on {{ r.runDate | date:'mediumDate' }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              @if (r.status !== 'completed') {
                <ui-button
                  variant="danger"
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
                <div class="inline-flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-600 dark:bg-green-500/15 dark:text-green-400">
                  <ui-icon name="lock-closed" class="w-5 h-5"></ui-icon>
                  <span>Run Completed & Locked</span>
                </div>
              }
            </div>
          </div>

        </div>

        <!-- Employee Slips List - Dash Frame -->
        <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700/60 dark:bg-stone-800/60 dark:shadow-none">
          <ui-grid [columns]="'1fr'" [gap]="'0px'">
            <ui-grid-tile title="Run Summary" variant="compact" divider="bottom">
              <div class="p-5">
                <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div class="flex flex-col">
                    <p class="mb-1 text-xs text-stone-500 dark:text-stone-400">Total Employees</p>
                    <p class="m-0 text-2xl font-bold text-stone-900 dark:text-stone-50">{{ r.employeeCount || 0 }}</p>
                  </div>
                  <div class="flex flex-col">
                    <p class="mb-1 text-xs text-stone-500 dark:text-stone-400">Total Gross Pay</p>
                    <p class="m-0 text-2xl font-bold text-stone-900 dark:text-stone-50">{{ r.totalGrossPay || 0 | currency }}</p>
                  </div>
                  <div class="flex flex-col">
                    <p class="mb-1 text-xs text-stone-500 dark:text-stone-400">Total Net Pay</p>
                    <p class="m-0 text-2xl font-bold text-burgundy-700 dark:text-rose-300">{{ r.totalNetPay || 0 | currency }}</p>
                  </div>
                </div>
              </div>
            </ui-grid-tile>

            <ui-grid-tile title="Payslips" variant="compact">
              <span tile-actions class="text-xs text-stone-500 dark:text-stone-400">{{ slips().length }} records</span>
              @if (slips().length > 0) {
                <ui-data-table
                  [data]="slips()"
                  [columns]="columns"
                  [headerVariant]="'neutral'"
                  [cellTemplates]="{ employee: employeeTpl, netSalary: netPayTpl, basicSalary: basicTpl, grossSalary: grossTpl }"
                  [actionsTemplate]="actionsTpl"
                ></ui-data-table>
                <ng-template #employeeTpl let-row>
                  <div class="flex flex-col gap-[0.15rem]">
                    <div class="font-semibold text-stone-900 dark:text-stone-50">{{ row.employeeName }}</div>
                    <div class="text-xs text-stone-500 dark:text-stone-400">{{ row.designation || 'No Designation' }}</div>
                  </div>
                </ng-template>
                <ng-template #basicTpl let-row>
                  <span class="text-stone-700 dark:text-stone-300">
                    {{ row.basicSalary | currency }}
                  </span>
                </ng-template>
                <ng-template #grossTpl let-row>
                  <span class="text-stone-700 dark:text-stone-300">
                    {{ row.grossSalary | currency }}
                  </span>
                </ng-template>
                <ng-template #netPayTpl let-row>
                  <span class="font-semibold text-burgundy-700 dark:text-burgundy-300">
                    {{ row.netSalary | currency }}
                  </span>
                </ng-template>
                <ng-template #actionsTpl let-row>
                  <button (click)="viewPayslip(row._id)" class="rounded px-2 py-1 text-xs font-semibold text-burgundy-700 transition-opacity hover:opacity-70 dark:text-rose-300">View Slip</button>
                </ng-template>
              } @else {
                <div class="px-6 py-12 text-center">
                  <div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 dark:bg-white/5">
                    <ui-icon name="calculator" class="h-8 w-8 text-stone-500 dark:text-stone-400"></ui-icon>
                  </div>
                  <h3 class="mb-2 text-base font-semibold text-stone-900 dark:text-stone-50">No payroll data calculated yet</h3>
                  <p class="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                    Click "Calculate Payroll" to process salaries for all active employees based on their configured salary and active adjustments.
                  </p>
                  @if (r.status !== 'completed') {
                    <ui-button (onClick)="processRun()" [loading]="isProcessing">
                      Calculate Now
                    </ui-button>
                  }
                </div>
              }
            </ui-grid-tile>
          </ui-grid>
        </div>
      } @else {
        <div class="flex min-h-64 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-burgundy-700 dark:border-stone-700/60 dark:border-t-rose-300"></div>
        </div>
      }
    </div>
  `,
})
export class PayrollRunComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  runId = signal<Id<"payroll_runs"> | null>(null);
  run = signal<any>(null);
  slips = signal<any[]>([]);
  columns: TableColumn[] = [
    { key: 'employee', header: 'Employee' },
    { key: 'department', header: 'Department', formatter: (val) => val || '-' },
    { key: 'basicSalary', header: 'Basic' },
    { key: 'grossSalary', header: 'Gross' },
    { key: 'netSalary', header: 'Net Pay' }
  ];

  isProcessing = false;
  isFinalizing = false;
  isDeleting = false;

  private isLikelyRunId(value: string): value is Id<"payroll_runs"> {
    return /^[a-z0-9]{20,}$/i.test(value);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        const rawId = String(params['id']);
        if (!this.isLikelyRunId(rawId)) {
          this.toast.error('Invalid payroll run identifier');
          this.router.navigate(['/payroll']);
          return;
        }
        const id = rawId as Id<"payroll_runs">;
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
    const currentRun = this.run();
    if (!currentRun) return;

    const reason = await this.confirmDialog.confirmWithReason({
      title: 'Finalize Payroll Run',
      message: 'This will lock the run and make payslips the official payroll output.',
      confirmText: 'Finalize',
      cancelText: 'Cancel',
      variant: 'warning',
      impactLabel: 'Impact Summary',
      details: [
        `Actor: ${this.run()?.processedBy || 'Current user'}`,
        `Target: ${this.getMonthName(currentRun.month)} ${currentRun.year} payroll run`,
        `Employees affected: ${currentRun.employeeCount || 0}`,
        'This action cannot be undone without administrative intervention.',
      ],
      reasonLabel: 'Finalization reason',
      reasonPlaceholder: 'Explain why this run is ready to finalize',
    });
    if (!reason) {
      this.toast.warning('A reason is required to finalize payroll');
      return;
    }

    this.isFinalizing = true;
    try {
      const result = await this.convex
        .getClient()
        .mutation(api.payroll.finalizeRun, { runId: this.runId()!, reason });
      if (result?.mode === 'pending') {
        this.toast.success('Payroll finalize request submitted for approval');
      } else {
        this.toast.success('Payroll run finalized and locked');
      }
    } catch (error: any) {
      this.toast.error(error.message || 'Failed to finalize run');
    } finally {
      this.isFinalizing = false;
    }
  }

  async deleteRun() {
    if (!this.runId()) return;
    const currentRun = this.run();
    if (!currentRun) return;

    const reason = await this.confirmDialog.confirmWithReason({
      title: 'Delete Payroll Run',
      message: 'Deleting this run will remove generated slips and cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      impactLabel: 'Impact Summary',
      details: [
        `Actor: ${this.run()?.processedBy || 'Current user'}`,
        `Target: ${this.getMonthName(currentRun.month)} ${currentRun.year} payroll run`,
        `Payslips to remove: ${this.slips().length}`,
        'This is irreversible once approved.',
      ],
      reasonLabel: 'Deletion reason',
      reasonPlaceholder: 'Explain why this payroll run should be deleted',
    });
    if (!reason) {
      this.toast.warning('A reason is required to delete payroll');
      return;
    }

    this.isDeleting = true;
    try {
      const result = await this.convex
        .getClient()
        .mutation(api.payroll.deleteRun, { runId: this.runId()!, reason });
      if (result?.mode === 'pending') {
        this.toast.success('Payroll deletion request submitted for approval');
      } else {
        this.toast.success('Payroll run deleted');
        this.router.navigate(['/payroll']);
      }
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
