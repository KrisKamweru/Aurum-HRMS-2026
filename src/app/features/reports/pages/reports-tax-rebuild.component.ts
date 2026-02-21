import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReportsCsvExportService } from '../data/reports-csv-export.service';
import { ReportsRebuildStore } from '../data/reports-rebuild.store';
import { TableColumn, UiDataTableComponent } from '../../../shared/components/ui-data-table/ui-data-table.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reports-tax-rebuild',
  imports: [RouterLink, UiButtonComponent, UiIconComponent, UiDataTableComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <a routerLink="/reports" class="text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
              <ui-icon name="arrow-left" class="h-4 w-4"></ui-icon>
            </a>
            <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Tax Report</h1>
          </div>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Statutory deduction detail for PAYE, NSSF, NHIF, and housing levy.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <ui-button variant="secondary" size="sm" [disabled]="taxLoading()" (onClick)="applyFilters()">Refresh</ui-button>
          <ui-button variant="outline" size="sm" [disabled]="taxRecords().length === 0" (onClick)="exportCsv()">Export CSV</ui-button>
        </div>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          {{ error() }}
        </section>
      }

      <section class="mb-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <label for="tax-run" class="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">Payroll Run</label>
            <select
              id="tax-run"
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
          <div class="flex justify-start lg:justify-end">
            <ui-button variant="primary" size="sm" [disabled]="taxLoading()" (onClick)="applyFilters()">Generate</ui-button>
          </div>
        </div>
      </section>

      <section class="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Employees</p>
          <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ taxSummary().employeeCount }}</p>
        </article>
        <article class="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-700/30 dark:bg-red-900/15">
          <p class="text-xs uppercase tracking-wide text-red-700 dark:text-red-300">PAYE</p>
          <p class="mt-1 text-2xl font-semibold text-red-800 dark:text-red-200">{{ formatMoney(taxSummary().totalPaye) }}</p>
        </article>
        <article class="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700/30 dark:bg-amber-900/15">
          <p class="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">NSSF + NHIF</p>
          <p class="mt-1 text-2xl font-semibold text-amber-800 dark:text-amber-200">
            {{ formatMoney(taxSummary().totalNssfEmployee + taxSummary().totalNssfEmployer + taxSummary().totalNhif) }}
          </p>
        </article>
        <article class="rounded-xl border border-burgundy-200 bg-burgundy-50 p-4 dark:border-burgundy-700/30 dark:bg-burgundy-900/15">
          <p class="text-xs uppercase tracking-wide text-burgundy-700 dark:text-burgundy-300">Total Statutory</p>
          <p class="mt-1 text-2xl font-semibold text-burgundy-800 dark:text-burgundy-200">{{ formatMoney(taxSummary().totalStatutory) }}</p>
        </article>
      </section>

      <ui-data-table [data]="taxRecords()" [columns]="columns" [loading]="taxLoading()" headerVariant="neutral" />
    </main>
  `
})
export class ReportsTaxRebuildComponent implements OnInit {
  private readonly store = inject(ReportsRebuildStore);
  private readonly csvExport = inject(ReportsCsvExportService);

  readonly payrollRuns = this.store.payrollRuns;
  readonly taxRecords = this.store.taxRecords;
  readonly taxSummary = this.store.taxSummary;
  readonly taxLoading = this.store.taxLoading;
  readonly error = this.store.error;

  readonly selectedRunId = signal('');

  readonly columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'kraPin', header: 'KRA PIN', sortable: true },
    { key: 'grossSalary', header: 'Gross Salary', formatter: (value) => this.formatMoneyValue(value) },
    { key: 'taxableIncome', header: 'Taxable Income', formatter: (value) => this.formatMoneyValue(value) },
    { key: 'paye', header: 'PAYE', formatter: (value) => this.formatMoneyValue(value) },
    { key: 'nssfEmployee', header: 'NSSF (Emp)', formatter: (value) => this.formatMoneyValue(value) },
    { key: 'nssfEmployer', header: 'NSSF (ER)', formatter: (value) => this.formatMoneyValue(value) },
    { key: 'nhif', header: 'NHIF', formatter: (value) => this.formatMoneyValue(value) },
    { key: 'housingLevy', header: 'Housing Levy', formatter: (value) => this.formatMoneyValue(value) }
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

  async applyFilters(): Promise<void> {
    const runId = this.selectedRunId().trim();
    if (!runId) {
      return;
    }
    await this.store.loadTax(runId);
  }

  exportCsv(): void {
    const run = this.store.taxRunInfo();
    const filename = run ? `tax-report-${run.year}-${String(run.month).padStart(2, '0')}` : 'tax-report';
    const rows = this.taxRecords().map((record) => ({
      employeeName: record.employeeName,
      kraPin: record.kraPin,
      nhifNumber: record.nhifNumber,
      nssfNumber: record.nssfNumber,
      grossSalary: record.grossSalary,
      taxableIncome: record.taxableIncome,
      paye: record.paye,
      nssfEmployee: record.nssfEmployee,
      nssfEmployer: record.nssfEmployer,
      nhif: record.nhif,
      housingLevy: record.housingLevy
    }));
    this.csvExport.exportRows(filename, rows, [
      { key: 'employeeName', header: 'Employee Name' },
      { key: 'kraPin', header: 'KRA PIN' },
      { key: 'nhifNumber', header: 'NHIF Number' },
      { key: 'nssfNumber', header: 'NSSF Number' },
      { key: 'grossSalary', header: 'Gross Salary', formatter: (value) => this.formatMoneyValue(value) },
      { key: 'taxableIncome', header: 'Taxable Income', formatter: (value) => this.formatMoneyValue(value) },
      { key: 'paye', header: 'PAYE', formatter: (value) => this.formatMoneyValue(value) },
      { key: 'nssfEmployee', header: 'NSSF Employee', formatter: (value) => this.formatMoneyValue(value) },
      { key: 'nssfEmployer', header: 'NSSF Employer', formatter: (value) => this.formatMoneyValue(value) },
      { key: 'nhif', header: 'NHIF', formatter: (value) => this.formatMoneyValue(value) },
      { key: 'housingLevy', header: 'Housing Levy', formatter: (value) => this.formatMoneyValue(value) }
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
