import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { UiDataTableComponent, TableColumn } from '../../../shared/components/ui-data-table/ui-data-table.component';
import { ReportFiltersComponent, ReportFilters } from '../components/report-filters.component';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { CsvExportService } from '../../../core/services/csv-export.service';
import { ToastService } from '../../../shared/services/toast.service';
import { api } from '../../../../../convex/_generated/api';

interface PayrollRecord {
  _id: string;
  employeeName: string;
  designation: string;
  department: string;
  basicSalary: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
}

interface PayrollSummary {
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
}

interface PayrollRunInfo {
  month: number;
  year: number;
  status: string;
  runDate: string;
}

@Component({
  selector: 'app-payroll-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UiButtonComponent,
    UiIconComponent,
    UiDataTableComponent,
    ReportFiltersComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <a routerLink="/reports" class="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              <ui-icon name="arrow-left" class="w-5 h-5"></ui-icon>
            </a>
            <h1 class="text-2xl font-bold text-stone-900 dark:text-stone-100">Payroll Report</h1>
          </div>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400 ml-8">
            @if (runInfo()) {
              {{ getMonthName(runInfo()!.month) }} {{ runInfo()!.year }} payroll breakdown
            } @else {
              View salary details and totals for completed payroll runs
            }
          </p>
        </div>

        @if (records().length > 0) {
          <ui-button
            variant="outline"
            (onClick)="exportToCsv()"
            [loading]="exporting()"
          >
            <ui-icon name="arrow-down-tray" class="w-4 h-4 mr-2"></ui-icon>
            Export CSV
          </ui-button>
        }
      </div>

      <!-- Filters -->
      <app-report-filters
        [showPayrollRun]="true"
        [showDepartment]="true"
        (filtersChange)="onFiltersChange($event)"
      ></app-report-filters>

      <!-- Summary Cards -->
      @if (summary()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ui-icon name="users" class="w-5 h-5 text-blue-600 dark:text-blue-400"></ui-icon>
              </div>
              <div>
                <p class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Employees</p>
                <p class="text-xl font-bold text-stone-900 dark:text-stone-100">{{ summary()!.employeeCount }}</p>
              </div>
            </div>
          </div>
          <div class="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ui-icon name="banknotes" class="w-5 h-5 text-green-600 dark:text-green-400"></ui-icon>
              </div>
              <div>
                <p class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Total Gross</p>
                <p class="text-xl font-bold text-stone-900 dark:text-stone-100">{{ formatCurrency(summary()!.totalGross) }}</p>
              </div>
            </div>
          </div>
          <div class="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ui-icon name="minus-circle" class="w-5 h-5 text-red-600 dark:text-red-400"></ui-icon>
              </div>
              <div>
                <p class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Total Deductions</p>
                <p class="text-xl font-bold text-stone-900 dark:text-stone-100">{{ formatCurrency(summary()!.totalDeductions) }}</p>
              </div>
            </div>
          </div>
          <div class="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-burgundy-100 dark:bg-burgundy-900/30 flex items-center justify-center">
                <ui-icon name="currency-dollar" class="w-5 h-5 text-burgundy-600 dark:text-burgundy-400"></ui-icon>
              </div>
              <div>
                <p class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Total Net Pay</p>
                <p class="text-xl font-bold text-burgundy-700 dark:text-burgundy-300">{{ formatCurrency(summary()!.totalNet) }}</p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Data Table -->
      <ui-data-table
        [data]="records()"
        [columns]="columns"
        [loading]="loading()"
      ></ui-data-table>

      <!-- Empty State -->
      @if (!loading() && records().length === 0 && hasAppliedFilters()) {
        <div class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-12 text-center">
          <ui-icon name="banknotes" class="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4"></ui-icon>
          <p class="text-stone-600 dark:text-stone-400">No payroll records found for the selected filters</p>
        </div>
      }
    </div>
  `
})
export class PayrollReportComponent implements OnDestroy {
  private convexService = inject(ConvexClientService);
  private csvExportService = inject(CsvExportService);
  private toastService = inject(ToastService);

  records = signal<PayrollRecord[]>([]);
  summary = signal<PayrollSummary | null>(null);
  runInfo = signal<PayrollRunInfo | null>(null);
  loading = signal(false);
  exporting = signal(false);

  private currentFilters: ReportFilters | null = null;
  private unsubscribe?: () => void;

  columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'designation', header: 'Designation', sortable: true },
    { key: 'department', header: 'Department', sortable: true },
    {
      key: 'basicSalary',
      header: 'Basic Salary',
      type: 'currency',
      sortable: true
    },
    {
      key: 'grossSalary',
      header: 'Gross',
      type: 'currency',
      sortable: true
    },
    {
      key: 'deductions',
      header: 'Deductions',
      type: 'currency',
      sortable: true
    },
    {
      key: 'netSalary',
      header: 'Net Pay',
      type: 'currency',
      sortable: true
    },
  ];

  hasAppliedFilters(): boolean {
    return this.currentFilters !== null;
  }

  onFiltersChange(filters: ReportFilters) {
    this.currentFilters = filters;
    this.loadReport(filters);
  }

  private loadReport(filters: ReportFilters) {
    if (!filters.payrollRunId) return;

    this.loading.set(true);
    this.unsubscribe?.();

    const client = this.convexService.getClient();

    this.unsubscribe = client.onUpdate(
      api.reports.getPayrollReport,
      {
        runId: filters.payrollRunId,
        departmentId: filters.departmentId || undefined,
      },
      (data) => {
        this.records.set(data.records as PayrollRecord[]);
        this.summary.set(data.summary as PayrollSummary);
        this.runInfo.set(data.run as PayrollRunInfo);
        this.loading.set(false);
      }
    );
  }

  exportToCsv() {
    if (this.records().length === 0) return;

    this.exporting.set(true);

    const csvColumns = [
      { key: 'employeeName', header: 'Employee Name' },
      { key: 'designation', header: 'Designation' },
      { key: 'department', header: 'Department' },
      {
        key: 'basicSalary',
        header: 'Basic Salary',
        formatter: (value: unknown) => this.csvExportService.formatCurrency(value)
      },
      {
        key: 'grossSalary',
        header: 'Gross Salary',
        formatter: (value: unknown) => this.csvExportService.formatCurrency(value)
      },
      {
        key: 'deductions',
        header: 'Total Deductions',
        formatter: (value: unknown) => this.csvExportService.formatCurrency(value)
      },
      {
        key: 'netSalary',
        header: 'Net Pay',
        formatter: (value: unknown) => this.csvExportService.formatCurrency(value)
      },
    ];

    const run = this.runInfo();
    const filename = run
      ? `payroll-report-${this.getMonthName(run.month)}-${run.year}`
      : 'payroll-report';

    this.csvExportService.exportToCsv(this.records() as unknown as Record<string, unknown>[], csvColumns, filename);

    this.exporting.set(false);
    this.toastService.success('Payroll report exported successfully');
  }

  formatCurrency(value: number): string {
    return `KES ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  }

  ngOnDestroy() {
    this.unsubscribe?.();
  }
}
