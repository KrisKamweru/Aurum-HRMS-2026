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
  template: ''
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
