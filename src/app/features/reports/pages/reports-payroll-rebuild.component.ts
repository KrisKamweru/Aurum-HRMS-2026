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
  template: ''
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
