import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReportsCsvExportService } from '../data/reports-csv-export.service';
import { ReportsRebuildStore } from '../data/reports-rebuild.store';
import { TableColumn, UiDataTableComponent } from '../../../shared/components/ui-data-table/ui-data-table.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reports-payroll-rebuild',
  imports: [RouterLink, UiButtonComponent, UiIconComponent, UiDataTableComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <a routerLink="/reports" class="text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
              <ui-icon name="arrow-left" class="h-4 w-4"></ui-icon>
            </a>
            <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Payroll Report</h1>
          </div>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Analyze gross pay, deductions, and net payout values per payroll run.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <ui-button variant="secondary" size="sm" [disabled]="payrollLoading()" (onClick)="applyFilters()">Refresh</ui-button>
          <ui-button variant="outline" size="sm" [disabled]="payrollRecords().length === 0" (onClick)="exportCsv()">
            Export CSV
          </ui-button>
        </div>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          {{ error() }}
        </section>
      }

      <section class="mb-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
          <div>
            <label for="payroll-run" class="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">Payroll Run</label>
            <select
              id="payroll-run"
              class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/[0.03] dark:text-white"
              [value]="selectedRunId()"
              (change)="setRun($event)"
            >
              <option value="">Select a run</option>
              @for (run of payrollRuns(); track run.id) {
                <option [value]="run.id">{{ run.label }}</option>
              }
            </select>
          </div>
          <div>
            <label for="payroll-department" class="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">Department</label>
            <select
              id="payroll-department"
              class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/[0.03] dark:text-white"
              [value]="selectedDepartmentId()"
              (change)="setDepartment($event)"
            >
              <option value="">All Departments</option>
              @for (department of departments(); track department.id) {
                <option [value]="department.id">{{ department.name }}</option>
              }
            </select>
          </div>
          <div class="flex justify-start lg:justify-end">
            <ui-button variant="primary" size="sm" [disabled]="payrollLoading()" (onClick)="applyFilters()">Generate</ui-button>
          </div>
        </div>
      </section>

      <section class="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Employees</p>
          <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ payrollSummary().employeeCount }}</p>
        </article>
        <article class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700/30 dark:bg-emerald-900/15">
          <p class="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Gross</p>
          <p class="mt-1 text-2xl font-semibold text-emerald-800 dark:text-emerald-200">{{ formatMoney(payrollSummary().totalGross) }}</p>
        </article>
        <article class="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-700/30 dark:bg-red-900/15">
          <p class="text-xs uppercase tracking-wide text-red-700 dark:text-red-300">Deductions</p>
          <p class="mt-1 text-2xl font-semibold text-red-800 dark:text-red-200">{{ formatMoney(payrollSummary().totalDeductions) }}</p>
        </article>
        <article class="rounded-xl border border-burgundy-200 bg-burgundy-50 p-4 dark:border-burgundy-700/30 dark:bg-burgundy-900/15">
          <p class="text-xs uppercase tracking-wide text-burgundy-700 dark:text-burgundy-300">Net Pay</p>
          <p class="mt-1 text-2xl font-semibold text-burgundy-800 dark:text-burgundy-200">{{ formatMoney(payrollSummary().totalNet) }}</p>
        </article>
      </section>

      <ui-data-table [data]="payrollRecords()" [columns]="columns" [loading]="payrollLoading()" headerVariant="neutral" />
    </main>
  `
})
export class ReportsPayrollRebuildComponent implements OnInit {
  private readonly store = inject(ReportsRebuildStore);
  private readonly csvExport = inject(ReportsCsvExportService);

  readonly departments = this.store.departments;
  readonly payrollRuns = this.store.payrollRuns;
  readonly payrollRecords = this.store.payrollRecords;
  readonly payrollSummary = this.store.payrollSummary;
  readonly payrollLoading = this.store.payrollLoading;
  readonly error = this.store.error;

  readonly selectedRunId = signal('');
  readonly selectedDepartmentId = signal('');

  readonly columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'designation', header: 'Designation', sortable: true },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'basicSalary', header: 'Basic Salary', formatter: (value) => this.formatMoneyValue(value) },
    { key: 'grossSalary', header: 'Gross', formatter: (value) => this.formatMoneyValue(value) },
    { key: 'deductions', header: 'Deductions', formatter: (value) => this.formatMoneyValue(value) },
    { key: 'netSalary', header: 'Net Pay', formatter: (value) => this.formatMoneyValue(value) }
  ];

  ngOnInit(): void {
    void this.store.loadFilterOptions().then(() => {
      const firstRun = this.payrollRuns()[0];
      if (firstRun) {
        this.selectedRunId.set(firstRun.id);
        void this.applyFilters();
      }
    });
  }

  setRun(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    this.selectedRunId.set(target.value);
  }

  setDepartment(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    this.selectedDepartmentId.set(target.value);
  }

  async applyFilters(): Promise<void> {
    const runId = this.selectedRunId().trim();
    if (!runId) {
      return;
    }
    await this.store.loadPayroll({
      runId,
      departmentId: this.selectedDepartmentId().trim() || undefined
    });
  }

  exportCsv(): void {
    const run = this.store.payrollRunInfo();
    const filename = run ? `payroll-report-${run.year}-${String(run.month).padStart(2, '0')}` : 'payroll-report';
    const rows = this.payrollRecords().map((record) => ({
      employeeName: record.employeeName,
      designation: record.designation,
      department: record.department,
      basicSalary: record.basicSalary,
      grossSalary: record.grossSalary,
      deductions: record.deductions,
      netSalary: record.netSalary
    }));
    this.csvExport.exportRows(filename, rows, [
      { key: 'employeeName', header: 'Employee Name' },
      { key: 'designation', header: 'Designation' },
      { key: 'department', header: 'Department' },
      { key: 'basicSalary', header: 'Basic Salary', formatter: (value) => this.formatMoneyValue(value) },
      { key: 'grossSalary', header: 'Gross Salary', formatter: (value) => this.formatMoneyValue(value) },
      { key: 'deductions', header: 'Deductions', formatter: (value) => this.formatMoneyValue(value) },
      { key: 'netSalary', header: 'Net Pay', formatter: (value) => this.formatMoneyValue(value) }
    ]);
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);
  }

  private formatMoneyValue(value: unknown): string {
    const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return this.formatMoney(amount);
  }
}
