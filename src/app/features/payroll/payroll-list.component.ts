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
import { ToastService } from '../../shared/services/toast.service';

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
    <div class="payroll-list-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Payroll Runs</h1>
          <p class="page-subtitle">Manage monthly payroll processing and salary slips</p>
        </div>
        <ui-button (onClick)="openCreateModal()" variant="primary" icon="plus">
          <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
          New Run
        </ui-button>
      </div>

      <!-- Payroll Overview + Run History (Unified Grid) -->
      <div class="dash-frame">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="Payroll Overview" variant="compact" divider="bottom">
            <div class="tile-body">
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon-wrapper bg-blue">
                    <ui-icon name="banknotes" class="w-6 h-6"></ui-icon>
                  </div>
                  <div>
                    <p class="stat-label">Total Processed (YTD)</p>
                    <h3 class="stat-value">--</h3>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon-wrapper bg-green">
                    <ui-icon name="users" class="w-6 h-6"></ui-icon>
                  </div>
                  <div>
                    <p class="stat-label">Employees Paid</p>
                    <h3 class="stat-value">--</h3>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon-wrapper bg-amber">
                    <ui-icon name="clock" class="w-6 h-6"></ui-icon>
                  </div>
                  <div>
                    <p class="stat-label">Pending Runs</p>
                    <h3 class="stat-value">--</h3>
                  </div>
                </div>
              </div>
            </div>
          </ui-grid-tile>

            <ui-grid-tile title="Payroll Run History" variant="compact">
              <span tile-actions class="df-count">{{ runs().length }} runs</span>
              <div class="overflow-x-auto">
                <ui-data-table
                  [data]="runs()"
                  [columns]="columns"
                  [headerVariant]="'neutral'"
                  [cellTemplates]="{ period: periodTpl, totalNetPay: netPayTpl }"
                  [actionsTemplate]="actionsTpl"
                ></ui-data-table>
                <ng-template #periodTpl let-row>
                  <div class="period-cell">
                    <div class="period-badge">
                      {{ getMonthName(row.month) | slice:0:3 }}
                    </div>
                    <span class="period-name">
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
                  <button (click)="viewRun(row._id)" class="action-link">View</button>
                </ng-template>
              </div>
            </ui-grid-tile>
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
        submitLabel="Create Draft"
        [loading]="isCreating"
        (formSubmit)="handleCreateRun($event)"
        (cancel)="isCreateModalOpen = false"
        [showCancel]="true"
      ></app-dynamic-form>
    </ui-modal>
  `,
  styles: [`
    :host {
      display: block;
      --red: #861821;
    }

    .payroll-list-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .tile-body {
      padding: 1.25rem;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: 1.875rem;
      font-weight: 700;
      color: #1c1917;
      margin: 0;
      line-height: 1.2;
    }
    :host-context(.dark) .page-title { color: white; }

    .page-subtitle {
      font-size: 0.9375rem;
      color: #57534e;
      margin: 0.5rem 0 0;
    }
    :host-context(.dark) .page-subtitle { color: #a8a29e; }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: white;
      border: 1px solid #e7e5e4;
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    :host-context(.dark) .stat-card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(12px);
      border-color: rgba(255,255,255,0.08);
      box-shadow: none;
    }

    .stat-icon-wrapper {
      padding: 0.75rem;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon-wrapper.bg-blue {
      background: rgba(59, 130, 246, 0.15);
      color: #2563eb;
    }
    :host-context(.dark) .stat-icon-wrapper.bg-blue { color: #60a5fa; }

    .stat-icon-wrapper.bg-green {
      background: rgba(34, 197, 94, 0.15);
      color: #16a34a;
    }
    :host-context(.dark) .stat-icon-wrapper.bg-green { color: #4ade80; }

    .stat-icon-wrapper.bg-amber {
      background: rgba(245, 158, 11, 0.15);
      color: #d97706;
    }
    :host-context(.dark) .stat-icon-wrapper.bg-amber { color: #fbbf24; }

    .stat-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #57534e;
      margin: 0 0 0.25rem;
    }
    :host-context(.dark) .stat-label { color: #a8a29e; }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1c1917;
      margin: 0;
    }
    :host-context(.dark) .stat-value { color: white; }

    /* Dash Frame Pattern */
    .dash-frame {
      background: white;
      border: 1px solid #e7e5e4;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    :host-context(.dark) .dash-frame {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(12px);
      border-color: rgba(255,255,255,0.08);
      box-shadow: none;
    }

    .df-count {
      font-size: 0.75rem;
      color: #78716c;
    }
    :host-context(.dark) .df-count { color: #a8a29e; }

    .period-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .period-badge {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: rgba(134,24,33,0.1);
      color: #861821;
      font-weight: 700;
      font-size: 0.75rem;
    }
    :host-context(.dark) .period-badge {
      background: rgba(134,24,33,0.25);
      color: #ff6b77;
    }

    .period-name {
      font-weight: 600;
      color: #1c1917;
    }
    :host-context(.dark) .period-name { color: white; }

    .action-link {
      color: var(--red);
      font-weight: 600;
      font-size: 0.875rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      transition: opacity 0.2s;
    }

    .action-link:hover {
      opacity: 0.7;
    }
  `]
})
export class PayrollListComponent implements OnInit {
  private convex = inject(ConvexClientService);
  private router = inject(Router);
  private toast = inject(ToastService);

  runs = signal<any[]>([]);
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

  createFormFields: FieldConfig[] = [
    {
      name: 'month',
      label: 'Month',
      type: 'select',
      required: true,
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
      placeholder: new Date().getFullYear().toString()
    }
  ];

  ngOnInit() {
    const client = this.convex.getClient();
    // Subscribe to updates
    client.onUpdate(api.payroll.listRuns, {}, (runs) => {
      this.runs.set(runs);
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
