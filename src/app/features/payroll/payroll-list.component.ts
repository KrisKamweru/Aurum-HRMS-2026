import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiModalComponent } from '../../shared/components/ui-modal/ui-modal.component';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form.component';
import { UiGridTileComponent } from '../../shared/components/ui-grid/ui-grid-tile.component';
import { UiGridComponent } from '../../shared/components/ui-grid/ui-grid.component';
import { UiDataTableComponent, TableColumn } from '../../shared/components/ui-data-table/ui-data-table.component';
import { FieldConfig } from '../../shared/services/form-helper.service';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { ToastService } from '../../shared/services/toast.service';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-payroll-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UiButtonComponent,
    UiIconComponent,
    UiModalComponent,
    DynamicFormComponent,
    UiGridTileComponent,
    UiGridComponent,
    UiDataTableComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header -->
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold leading-tight text-stone-900 dark:text-white">Payroll Runs</h1>
          <p class="mt-2 text-[0.9375rem] text-stone-600 dark:text-stone-400">Manage monthly payroll processing and salary slips</p>
        </div>
        <ui-button (onClick)="openCreateModal()" variant="primary" icon="plus">
          <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
          New Run
        </ui-button>
      </div>

      <!-- Payroll Overview + Run History (Unified Grid) -->
      <div class="overflow-hidden rounded-[14px] border border-stone-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:border-white/8 dark:bg-white/5 dark:shadow-none dark:backdrop-blur-xl">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="Payroll Overview" variant="compact" divider="bottom">
            <div class="p-5">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div class="flex items-center gap-4 rounded-[14px] border border-stone-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:border-white/8 dark:bg-white/5 dark:shadow-none dark:backdrop-blur-xl">
                  <div class="flex items-center justify-center rounded-[10px] bg-blue-500/15 p-3 text-blue-600 dark:text-blue-400">
                    <ui-icon name="banknotes" class="w-6 h-6"></ui-icon>
                  </div>
                  <div>
                    <p class="mb-1 text-[0.8125rem] font-medium text-stone-600 dark:text-stone-400">Total Processed (YTD)</p>
                    <h3 class="text-2xl font-bold text-stone-900 dark:text-white">--</h3>
                  </div>
                </div>

                <div class="flex items-center gap-4 rounded-[14px] border border-stone-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:border-white/8 dark:bg-white/5 dark:shadow-none dark:backdrop-blur-xl">
                  <div class="flex items-center justify-center rounded-[10px] bg-green-500/15 p-3 text-green-600 dark:text-green-400">
                    <ui-icon name="users" class="w-6 h-6"></ui-icon>
                  </div>
                  <div>
                    <p class="mb-1 text-[0.8125rem] font-medium text-stone-600 dark:text-stone-400">Employees Paid</p>
                    <h3 class="text-2xl font-bold text-stone-900 dark:text-white">--</h3>
                  </div>
                </div>

                <div class="flex items-center gap-4 rounded-[14px] border border-stone-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:border-white/8 dark:bg-white/5 dark:shadow-none dark:backdrop-blur-xl">
                  <div class="flex items-center justify-center rounded-[10px] bg-amber-500/15 p-3 text-amber-600 dark:text-amber-400">
                    <ui-icon name="clock" class="w-6 h-6"></ui-icon>
                  </div>
                  <div>
                    <p class="mb-1 text-[0.8125rem] font-medium text-stone-600 dark:text-stone-400">Pending Runs</p>
                    <h3 class="text-2xl font-bold text-stone-900 dark:text-white">--</h3>
                  </div>
                </div>
              </div>
            </div>
          </ui-grid-tile>

            <ui-grid-tile title="Payroll Run History" variant="compact">
              <span tile-actions class="text-xs text-stone-500 dark:text-stone-400">{{ runs().length }} runs</span>
              <div class="overflow-x-auto">
                <ui-data-table
                  cornerStyle="square"
                  [data]="runs()"
                  [columns]="columns"
                  [headerVariant]="'plain'"
                  [cellTemplates]="{ period: periodTpl, totalNetPay: netPayTpl }"
                  [actionsTemplate]="actionsTpl"
                ></ui-data-table>
                <ng-template #periodTpl let-row>
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-burgundy-700/10 text-xs font-bold text-burgundy-700 dark:bg-burgundy-700/25 dark:text-rose-300">
                      {{ getMonthName(row.month) | slice:0:3 }}
                    </div>
                    <span class="font-semibold text-stone-900 dark:text-white">
                      {{ getMonthName(row.month) }} {{ row.year }}
                    </span>
                  </div>
                </ng-template>
                <ng-template #netPayTpl let-row>
                  <span class="font-semibold text-stone-900 dark:text-white">
                    {{ row.totalNetPay ? (row.totalNetPay | currency) : '-' }}
                  </span>
                </ng-template>
                <ng-template #actionsTpl let-row>
                  <button (click)="viewRun(row._id)" class="rounded px-2 py-1 text-sm font-semibold text-burgundy-700 transition-opacity hover:opacity-70 dark:text-rose-300">View</button>
                </ng-template>
              </div>
            </ui-grid-tile>

            @if (pendingChanges().length > 0) {
              <ui-grid-tile title="Pending Sensitive Changes" variant="compact">
                <span tile-actions class="text-xs text-stone-500 dark:text-stone-400">{{ pendingChanges().length }} awaiting approval</span>
                <ui-data-table
                  cornerStyle="square"
                  [data]="pendingChanges()"
                  [columns]="pendingColumns"
                  [headerVariant]="'plain'"
                  [actionsTemplate]="pendingActionsTpl"
                ></ui-data-table>
                <ng-template #pendingActionsTpl let-row>
                  <div class="flex items-center gap-2">
                    <button (click)="approveChange(row._id)" class="rounded px-2 py-1 text-sm font-semibold text-burgundy-700 transition-opacity hover:opacity-70 dark:text-rose-300">Approve</button>
                    <button (click)="rejectChange(row._id)" class="rounded px-2 py-1 text-sm font-semibold text-red-600 transition-opacity hover:opacity-70 dark:text-red-400">Reject</button>
                  </div>
                </ng-template>
              </ui-grid-tile>
            }
          </ui-grid>
        </div>
    </div>


    <!-- Create Run Modal -->
    <ui-modal
      [(isOpen)]="isCreateModalOpen"
      title="Create New Payroll Run"
      size="md"
    >
      <app-dynamic-form
        [fields]="createFormFields"
        [sections]="createFormSections"
        [container]="'modal'"
        submitLabel="Create Draft"
        [loading]="isCreating"
        (formSubmit)="handleCreateRun($event)"
        (cancel)="isCreateModalOpen = false"
        [showCancel]="true"
      ></app-dynamic-form>
    </ui-modal>
  `,
})
export class PayrollListComponent implements OnInit {
  private convex = inject(ConvexClientService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  runs = signal<any[]>([]);
  pendingChanges = signal<any[]>([]);
  isCreateModalOpen = false;
  isCreating = false;
  columns: TableColumn[] = [
    {
      key: 'period',
      header: 'Period'
    },
    {
      key: 'runDate',
      header: 'Run Date',
      type: 'date'
    },
    {
      key: 'employeeCount',
      header: 'Employees',
      formatter: (val) => val ?? '-'
    },
    {
      key: 'totalNetPay',
      header: 'Total Net Pay'
    },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      badgeVariant: (val) => {
        switch (val) {
          case 'completed': return 'success';
          case 'processing': return 'info';
          case 'draft':
          default: return 'neutral';
        }
      }
    }
  ];
  pendingColumns: TableColumn[] = [
    { key: 'targetTable', header: 'Target' },
    {
      key: 'operation',
      header: 'Operation',
      type: 'badge',
      badgeVariant: (val) => {
        switch (val) {
          case 'delete':
            return 'danger';
          case 'update':
            return 'warning';
          default:
            return 'info';
        }
      }
    },
    { key: 'reason', header: 'Reason', formatter: (val) => val || '-' },
    { key: 'createdAt', header: 'Requested', type: 'date' },
  ];

  createFormFields: FieldConfig[] = [
    {
      name: 'month',
      label: 'Month',
      type: 'select',
      required: true,
      sectionId: 'period',
      options: [
        { label: 'January', value: 1 },
        { label: 'February', value: 2 },
        { label: 'March', value: 3 },
        { label: 'April', value: 4 },
        { label: 'May', value: 5 },
        { label: 'June', value: 6 },
        { label: 'July', value: 7 },
        { label: 'August', value: 8 },
        { label: 'September', value: 9 },
        { label: 'October', value: 10 },
        { label: 'November', value: 11 },
        { label: 'December', value: 12 },
      ]
    },
    {
      name: 'year',
      label: 'Year',
      type: 'number',
      required: true,
      sectionId: 'period',
      placeholder: new Date().getFullYear().toString()
    }
  ];
  createFormSections = [
    {
      id: 'period',
      title: 'Payroll Period',
      description: 'Select the payroll month and year to open as a draft run.',
      columns: { base: 1 as const, md: 2 as const, lg: 2 as const }
    }
  ];

  ngOnInit() {
    const client = this.convex.getClient();
    // Subscribe to updates
    client.onUpdate(api.payroll.listRuns, {}, (runs) => {
      this.runs.set(runs);
    });
    client.onUpdate(api.payroll.listPendingSensitiveChanges, {}, (requests) => {
      this.pendingChanges.set(requests);
    });
  }

  openCreateModal() {
    // Pre-fill next logical month
    // If we have runs, take the latest one and add 1 month
    // Otherwise current month
    this.isCreateModalOpen = true;
  }

  async handleCreateRun(data: any) {
    this.isCreating = true;
    try {
      const runId = await this.convex.getClient().mutation(api.payroll.createRun, {
        month: Number(data.month),
        year: Number(data.year)
      });

      this.toast.success('Payroll run created successfully');
      this.isCreateModalOpen = false;
      this.router.navigate(['/payroll', runId]);
    } catch (error: any) {
      console.error('Failed to create run:', error);
      this.toast.error(error.message || 'Failed to create payroll run');
    } finally {
      this.isCreating = false;
    }
  }

  viewRun(id: string) {
    this.router.navigate(['/payroll', id]);
  }

  async approveChange(changeRequestId: Id<'change_requests'>) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Approve Sensitive Change',
      message: 'Confirm approval for this pending sensitive payroll request.',
      confirmText: 'Approve',
      cancelText: 'Cancel',
      variant: 'warning',
    });
    if (!confirmed) return;

    try {
      await this.convex.getClient().mutation(api.payroll.reviewSensitiveChange, {
        changeRequestId,
        decision: 'approved',
      });
      this.toast.success('Change approved successfully');
    } catch (error: any) {
      this.toast.error(error.message || 'Failed to approve change');
    }
  }

  async rejectChange(changeRequestId: Id<'change_requests'>) {
    const reason = await this.confirmDialog.confirmWithReason({
      title: 'Reject Sensitive Change',
      message: 'Provide a rejection reason before denying this pending sensitive payroll request.',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      variant: 'danger',
      reasonLabel: 'Rejection reason',
      reasonPlaceholder: 'Explain why this request is being rejected',
    });
    if (!reason) {
      this.toast.warning('A rejection reason is required');
      return;
    }

    try {
      await this.convex.getClient().mutation(api.payroll.reviewSensitiveChange, {
        changeRequestId,
        decision: 'rejected',
        rejectionReason: reason,
      });
      this.toast.success('Change rejected');
    } catch (error: any) {
      this.toast.error(error.message || 'Failed to reject change');
    }
  }

  getMonthName(month: number): string {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
  }

  getStatusClasses(status: string): string {
    const base = 'px-2.5 py-0.5 rounded-full text-xs font-medium';
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

