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

interface TaxRecord {
  _id: string;
  employeeName: string;
  kraPin: string;
  nhifNumber: string;
  nssfNumber: string;
  grossSalary: number;
  taxableIncome: number;
  paye: number;
  nssfEmployee: number;
  nssfEmployer: number;
  nhif: number;
  housingLevy: number;
}

interface TaxSummary {
  employeeCount: number;
  totalPaye: number;
  totalNssfEmployee: number;
  totalNssfEmployer: number;
  totalNhif: number;
  totalHousingLevy: number;
  totalStatutory: number;
}

interface PayrollRunInfo {
  month: number;
  year: number;
  status: string;
  runDate: string;
}

@Component({
  selector: 'app-tax-report',
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
            <h1 class="text-2xl font-bold text-stone-900 dark:text-stone-100">Tax Deductions Report</h1>
          </div>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400 ml-8">
            @if (runInfo()) {
              {{ getMonthName(runInfo()!.month) }} {{ runInfo()!.year }} statutory deductions
            } @else {
              PAYE, NSSF, NHIF, and Housing Levy breakdown per employee
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
        (filtersChange)="onFiltersChange($event)"
      ></app-report-filters>

      <!-- Summary Cards -->
      @if (summary()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div class="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 rounded-full bg-blue-500"></div>
              <p class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Employees</p>
            </div>
            <p class="text-2xl font-bold text-stone-900 dark:text-stone-100">{{ summary()!.employeeCount }}</p>
          </div>
          <div class="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 rounded-full bg-red-500"></div>
              <p class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Total PAYE</p>
            </div>
            <p class="text-xl font-bold text-red-700 dark:text-red-300">{{ formatCurrency(summary()!.totalPaye) }}</p>
          </div>
          <div class="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 rounded-full bg-amber-500"></div>
              <p class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">NSSF (Emp)</p>
            </div>
            <p class="text-xl font-bold text-amber-700 dark:text-amber-300">{{ formatCurrency(summary()!.totalNssfEmployee) }}</p>
          </div>
          <div class="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 rounded-full bg-orange-500"></div>
              <p class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">NSSF (ER)</p>
            </div>
            <p class="text-xl font-bold text-orange-700 dark:text-orange-300">{{ formatCurrency(summary()!.totalNssfEmployer) }}</p>
          </div>
          <div class="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 rounded-full bg-green-500"></div>
              <p class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Total NHIF</p>
            </div>
            <p class="text-xl font-bold text-green-700 dark:text-green-300">{{ formatCurrency(summary()!.totalNhif) }}</p>
          </div>
          <div class="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 rounded-full bg-purple-500"></div>
              <p class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Housing Levy</p>
            </div>
            <p class="text-xl font-bold text-purple-700 dark:text-purple-300">{{ formatCurrency(summary()!.totalHousingLevy) }}</p>
          </div>
        </div>

        <!-- Total Statutory Card -->
        <div class="bg-gradient-to-r from-burgundy-50 to-burgundy-100/50 dark:from-burgundy-900/30 dark:to-burgundy-950/30 rounded-xl border border-burgundy-200 dark:border-burgundy-800/50 p-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-lg bg-burgundy-600 dark:bg-burgundy-700 flex items-center justify-center">
                <ui-icon name="calculator" class="w-6 h-6 text-white"></ui-icon>
              </div>
              <div>
                <p class="text-sm font-medium text-burgundy-800 dark:text-burgundy-300">Total Statutory Deductions</p>
                <p class="text-xs text-burgundy-600 dark:text-burgundy-400">PAYE + NSSF (Emp + ER) + NHIF + Housing Levy</p>
              </div>
            </div>
            <p class="text-2xl font-bold text-burgundy-800 dark:text-burgundy-200">{{ formatCurrency(summary()!.totalStatutory) }}</p>
          </div>
        </div>
      }

      <!-- Data Table -->
      <ui-data-table
        cornerStyle="square"
        [data]="records()"
        [columns]="columns"
        [loading]="loading()"
      ></ui-data-table>

      <!-- Empty State -->
      @if (!loading() && records().length === 0 && hasAppliedFilters()) {
        <div class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-12 text-center">
          <ui-icon name="document-text" class="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4"></ui-icon>
          <p class="text-stone-600 dark:text-stone-400">No tax records found for the selected payroll run</p>
        </div>
      }
    </div>
  `
})
export class TaxReportComponent implements OnDestroy {
  private convexService = inject(ConvexClientService);
  private csvExportService = inject(CsvExportService);
  private toastService = inject(ToastService);

  records = signal<TaxRecord[]>([]);
  summary = signal<TaxSummary | null>(null);
  runInfo = signal<PayrollRunInfo | null>(null);
  loading = signal(false);
  exporting = signal(false);

  private currentFilters: ReportFilters | null = null;
  private unsubscribe?: () => void;

  columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'kraPin', header: 'KRA PIN', sortable: true },
    {
      key: 'grossSalary',
      header: 'Gross',
      type: 'currency',
      sortable: true
    },
    {
      key: 'taxableIncome',
      header: 'Taxable Income',
      type: 'currency',
      sortable: true
    },
    {
      key: 'paye',
      header: 'PAYE',
      type: 'currency',
      sortable: true
    },
    {
      key: 'nssfEmployee',
      header: 'NSSF (Emp)',
      type: 'currency',
      sortable: true
    },
    {
      key: 'nssfEmployer',
      header: 'NSSF (ER)',
      type: 'currency',
      sortable: true
    },
    {
      key: 'nhif',
      header: 'NHIF',
      type: 'currency',
      sortable: true
    },
    {
      key: 'housingLevy',
      header: 'Housing Levy',
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
      api.reports.getTaxReport,
      {
        runId: filters.payrollRunId,
      },
      (data) => {
        this.records.set(data.records as TaxRecord[]);
        this.summary.set(data.summary as TaxSummary);
        this.runInfo.set(data.run as PayrollRunInfo);
        this.loading.set(false);
      }
    );
  }

  exportToCsv() {
    if (this.records().length === 0) return;

    this.exporting.set(true);

    // CSV formatted for tax filing - includes all statutory IDs
    const csvColumns = [
      { key: 'employeeName', header: 'Employee Name' },
      { key: 'kraPin', header: 'KRA PIN' },
      { key: 'nhifNumber', header: 'NHIF Number' },
      { key: 'nssfNumber', header: 'NSSF Number' },
      {
        key: 'grossSalary',
        header: 'Gross Salary',
        formatter: (value: unknown) => this.formatCsvCurrency(value)
      },
      {
        key: 'taxableIncome',
        header: 'Taxable Income',
        formatter: (value: unknown) => this.formatCsvCurrency(value)
      },
      {
        key: 'paye',
        header: 'PAYE',
        formatter: (value: unknown) => this.formatCsvCurrency(value)
      },
      {
        key: 'nssfEmployee',
        header: 'NSSF Employee',
        formatter: (value: unknown) => this.formatCsvCurrency(value)
      },
      {
        key: 'nssfEmployer',
        header: 'NSSF Employer',
        formatter: (value: unknown) => this.formatCsvCurrency(value)
      },
      {
        key: 'nhif',
        header: 'NHIF',
        formatter: (value: unknown) => this.formatCsvCurrency(value)
      },
      {
        key: 'housingLevy',
        header: 'Housing Levy',
        formatter: (value: unknown) => this.formatCsvCurrency(value)
      },
    ];

    const run = this.runInfo();
    const filename = run
      ? `tax-deductions-${this.getMonthName(run.month)}-${run.year}`
      : 'tax-deductions-report';

    this.csvExportService.exportToCsv(this.records() as unknown as Record<string, unknown>[], csvColumns, filename);

    this.exporting.set(false);
    this.toastService.success('Tax report exported successfully');
  }

  formatCurrency(value: number): string {
    return `KES ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private formatCsvCurrency(value: unknown): string {
    if (value === null || value === undefined) return '0.00';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
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
