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
    <div class="run-container">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="/payroll" class="breadcrumb-link">Payroll</a>
        <ui-icon name="chevron-right" class="w-4 h-4"></ui-icon>
        <span class="breadcrumb-current">Run Details</span>
      </div>

      @if (run(); as r) {
        <!-- Run Info Header - Glass Container -->
        <div class="run-header">
          <div class="run-header-top">
            <div>
              <div class="run-title-row">
                <h1 class="run-title">
                  {{ getMonthName(r.month) }} {{ r.year }}
                </h1>
                <span [class]="getStatusClasses(r.status)">
                  {{ r.status | titlecase }}
                </span>
              </div>
              <p class="run-subtitle">
                Created on {{ r.runDate | date:'mediumDate' }}
              </p>
            </div>

            <div class="run-actions">
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
                <div class="locked-badge">
                  <ui-icon name="lock-closed" class="w-5 h-5"></ui-icon>
                  <span>Run Completed & Locked</span>
                </div>
              }
            </div>
          </div>

        </div>

        <!-- Employee Slips List - Dash Frame -->
        <div class="dash-frame">
          <ui-grid [columns]="'1fr'" [gap]="'0px'">
            <ui-grid-tile title="Run Summary" variant="compact" divider="bottom">
              <div class="tile-body">
                <div class="stats-strip">
                  <div class="stat-item">
                    <p class="stat-item-label">Total Employees</p>
                    <p class="stat-item-value">{{ r.employeeCount || 0 }}</p>
                  </div>
                  <div class="stat-item">
                    <p class="stat-item-label">Total Gross Pay</p>
                    <p class="stat-item-value">{{ r.totalGrossPay || 0 | currency }}</p>
                  </div>
                  <div class="stat-item highlight">
                    <p class="stat-item-label">Total Net Pay</p>
                    <p class="stat-item-value">{{ r.totalNetPay || 0 | currency }}</p>
                  </div>
                </div>
              </div>
            </ui-grid-tile>

            <ui-grid-tile title="Payslips" variant="compact">
              <span tile-actions class="df-count">{{ slips().length }} records</span>
              @if (slips().length > 0) {
                <ui-data-table
                  [data]="slips()"
                  [columns]="columns"
                  [headerVariant]="'neutral'"
                  [cellTemplates]="{ employee: employeeTpl, netSalary: netPayTpl, basicSalary: basicTpl, grossSalary: grossTpl }"
                  [actionsTemplate]="actionsTpl"
                ></ui-data-table>
                <ng-template #employeeTpl let-row>
                  <div class="employee-cell">
                    <div class="employee-name">{{ row.employeeName }}</div>
                    <div class="employee-designation">{{ row.designation || 'No Designation' }}</div>
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
                  <button (click)="viewPayslip(row._id)" class="action-link">View Slip</button>
                </ng-template>
              } @else {
                <div class="empty-state-large">
                  <div class="empty-icon-wrapper">
                    <ui-icon name="calculator" class="empty-icon-lg"></ui-icon>
                  </div>
                  <h3 class="empty-title-lg">No payroll data calculated yet</h3>
                  <p class="empty-subtitle-lg">
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
        <div class="loading-state">
          <div class="spinner"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .run-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .tile-body {
      padding: 1.25rem;
    }

    /* Breadcrumb */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #78716c;
    }

    :host-context(.dark) .breadcrumb {
      color: #78716c;
    }

    .breadcrumb-link {
      color: #78716c;
      transition: color 0.2s;
    }

    .breadcrumb-link:hover {
      color: #861821;
    }

    :host-context(.dark) .breadcrumb-link:hover {
      color: #fca5a1;
    }

    .breadcrumb-current {
      color: #1c1917;
      font-weight: 500;
    }

    :host-context(.dark) .breadcrumb-current {
      color: #fafaf9;
    }

    /* Run Header - Dash Frame */
    .run-header {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e7e5e4;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
      padding: 1.5rem;
    }

    :host-context(.dark) .run-header {
      background: rgb(41 37 36 / 0.6);
      border-color: rgb(68 64 60 / 0.5);
      box-shadow: none;
    }

    .run-header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .run-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .run-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1c1917;
      margin: 0;
    }

    :host-context(.dark) .run-title {
      color: #fafaf9;
    }

    .run-subtitle {
      font-size: 0.875rem;
      color: #78716c;
      margin: 0;
    }

    :host-context(.dark) .run-subtitle {
      color: #78716c;
    }

    .run-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .locked-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      background: rgba(34, 197, 94, 0.1);
      color: #16a34a;
      font-size: 0.875rem;
      font-weight: 600;
    }

    :host-context(.dark) .locked-badge {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }

    /* Stats Strip */
    .stats-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
    }

    .stat-item-label {
      font-size: 0.75rem;
      color: #78716c;
      margin: 0 0 0.25rem;
    }

    :host-context(.dark) .stat-item-label {
      color: #78716c;
    }

    .stat-item-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1c1917;
      margin: 0;
    }

    :host-context(.dark) .stat-item-value {
      color: #fafaf9;
    }

    .stat-item.highlight .stat-item-value {
      color: #861821;
    }

    :host-context(.dark) .stat-item.highlight .stat-item-value {
      color: #fca5a1;
    }

    /* Dash Frame */
    .dash-frame {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e7e5e4;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
      overflow: hidden;
    }

    :host-context(.dark) .dash-frame {
      background: rgb(41 37 36 / 0.6);
      border-color: rgb(68 64 60 / 0.5);
      box-shadow: none;
    }

    .df-count {
      font-size: 0.75rem;
      color: #78716c;
    }

    :host-context(.dark) .df-count {
      color: #78716c;
    }

    .employee-cell {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .employee-name {
      font-weight: 600;
      color: #1c1917;
    }

    :host-context(.dark) .employee-name {
      color: #fafaf9;
    }

    .employee-designation {
      font-size: 0.75rem;
      color: #78716c;
    }

    :host-context(.dark) .employee-designation {
      color: #78716c;
    }

    .action-link {
      color: #861821;
      font-weight: 600;
      font-size: 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      transition: opacity 0.2s;
    }

    :host-context(.dark) .action-link {
      color: #fca5a1;
    }

    .action-link:hover {
      opacity: 0.7;
    }

    .text-right {
      text-align: right;
    }

    /* Empty State */
    .empty-state-large {
      padding: 3rem 1.5rem;
      text-align: center;
    }

    .empty-icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      background: #f5f5f4;
      margin-bottom: 1rem;
    }

    :host-context(.dark) .empty-icon-wrapper {
      background: rgba(255,255,255,0.05);
    }

    .empty-icon-lg {
      width: 2rem;
      height: 2rem;
      color: #78716c;
    }

    :host-context(.dark) .empty-icon-lg {
      color: #78716c;
    }

    .empty-title-lg {
      font-size: 1rem;
      font-weight: 600;
      color: #1c1917;
      margin: 0 0 0.5rem;
    }

    :host-context(.dark) .empty-title-lg {
      color: #fafaf9;
    }

    .empty-subtitle-lg {
      font-size: 0.875rem;
      color: #78716c;
      max-width: 32rem;
      margin: 0 auto 1.5rem;
      line-height: 1.6;
    }

    :host-context(.dark) .empty-subtitle-lg {
      color: #78716c;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 16rem;
    }

    .spinner {
      width: 2rem;
      height: 2rem;
      border: 2px solid #e7e5e4;
      border-top-color: #861821;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    :host-context(.dark) .spinner {
      border-color: rgb(68 64 60 / 0.5);
      border-top-color: #fca5a1;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .run-header-top {
        flex-direction: column;
      }

      .run-actions {
        width: 100%;
        justify-content: flex-start;
      }

      .stats-strip {
        grid-template-columns: 1fr;
      }
    }
  `],
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

    const confirmed = await this.confirmDialog.confirm({
      title: 'Finalize Payroll Run',
      message: 'Are you sure you want to finalize this payroll run? This action cannot be undone and will lock all records.',
      confirmText: 'Finalize',
      cancelText: 'Cancel',
      variant: 'warning'
    });

    if (!confirmed) return;

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

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Payroll Run',
      message: 'Are you sure you want to delete this payroll run? All generated slips will be removed.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

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
