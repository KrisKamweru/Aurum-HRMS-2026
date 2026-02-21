import { Injectable, inject, signal } from '@angular/core';
import {
  AnalyticsMetrics,
  AnalyticsPeriod,
  AttendanceReportFilters,
  AttendanceReportRecord,
  AttendanceReportSummary,
  PayrollReportFilters,
  PayrollReportRecord,
  PayrollReportSummary,
  PayrollRunInfo,
  ReportDepartment,
  ReportPayrollRun,
  TaxReportRecord,
  TaxReportSummary
} from './reports-rebuild.models';
import { ReportsRebuildDataService } from './reports-rebuild.data.service';

const emptyAttendanceSummary: AttendanceReportSummary = {
  totalRecords: 0,
  present: 0,
  late: 0,
  absent: 0,
  halfDay: 0,
  onLeave: 0,
  holiday: 0
};

const emptyPayrollSummary: PayrollReportSummary = {
  employeeCount: 0,
  totalGross: 0,
  totalDeductions: 0,
  totalNet: 0
};

const emptyTaxSummary: TaxReportSummary = {
  employeeCount: 0,
  totalPaye: 0,
  totalNssfEmployee: 0,
  totalNssfEmployer: 0,
  totalNhif: 0,
  totalHousingLevy: 0,
  totalStatutory: 0
};

@Injectable({ providedIn: 'root' })
export class ReportsRebuildStore {
  private readonly data = inject(ReportsRebuildDataService);

  private readonly departmentsState = signal<ReportDepartment[]>([]);
  private readonly payrollRunsState = signal<ReportPayrollRun[]>([]);

  private readonly attendanceRecordsState = signal<AttendanceReportRecord[]>([]);
  private readonly attendanceSummaryState = signal<AttendanceReportSummary>(emptyAttendanceSummary);

  private readonly payrollRecordsState = signal<PayrollReportRecord[]>([]);
  private readonly payrollSummaryState = signal<PayrollReportSummary>(emptyPayrollSummary);
  private readonly payrollRunInfoState = signal<PayrollRunInfo | null>(null);

  private readonly taxRecordsState = signal<TaxReportRecord[]>([]);
  private readonly taxSummaryState = signal<TaxReportSummary>(emptyTaxSummary);
  private readonly taxRunInfoState = signal<PayrollRunInfo | null>(null);

  private readonly analyticsState = signal<AnalyticsMetrics | null>(null);

  private readonly filtersLoadingState = signal(false);
  private readonly attendanceLoadingState = signal(false);
  private readonly payrollLoadingState = signal(false);
  private readonly taxLoadingState = signal(false);
  private readonly analyticsLoadingState = signal(false);
  private readonly scheduleRunningState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly departments = this.departmentsState.asReadonly();
  readonly payrollRuns = this.payrollRunsState.asReadonly();

  readonly attendanceRecords = this.attendanceRecordsState.asReadonly();
  readonly attendanceSummary = this.attendanceSummaryState.asReadonly();

  readonly payrollRecords = this.payrollRecordsState.asReadonly();
  readonly payrollSummary = this.payrollSummaryState.asReadonly();
  readonly payrollRunInfo = this.payrollRunInfoState.asReadonly();

  readonly taxRecords = this.taxRecordsState.asReadonly();
  readonly taxSummary = this.taxSummaryState.asReadonly();
  readonly taxRunInfo = this.taxRunInfoState.asReadonly();

  readonly analytics = this.analyticsState.asReadonly();

  readonly filtersLoading = this.filtersLoadingState.asReadonly();
  readonly attendanceLoading = this.attendanceLoadingState.asReadonly();
  readonly payrollLoading = this.payrollLoadingState.asReadonly();
  readonly taxLoading = this.taxLoadingState.asReadonly();
  readonly analyticsLoading = this.analyticsLoadingState.asReadonly();
  readonly scheduleRunning = this.scheduleRunningState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async loadFilterOptions(): Promise<void> {
    this.filtersLoadingState.set(true);
    this.clearError();
    try {
      const [departments, runs] = await Promise.all([this.data.getDepartments(), this.data.getPayrollRuns()]);
      this.departmentsState.set(departments);
      this.payrollRunsState.set(runs);
    } catch (error: unknown) {
      this.setError(error, 'Unable to load report filter options.');
    } finally {
      this.filtersLoadingState.set(false);
    }
  }

  async loadAttendance(filters: AttendanceReportFilters): Promise<void> {
    if (!filters.startDate.trim() || !filters.endDate.trim()) {
      this.errorState.set('Start and end dates are required.');
      return;
    }

    this.attendanceLoadingState.set(true);
    this.clearError();
    try {
      const result = await this.data.getAttendanceReport(filters);
      this.attendanceRecordsState.set(result.records);
      this.attendanceSummaryState.set(result.summary);
    } catch (error: unknown) {
      this.attendanceRecordsState.set([]);
      this.attendanceSummaryState.set(emptyAttendanceSummary);
      this.setError(error, 'Unable to load attendance report.');
    } finally {
      this.attendanceLoadingState.set(false);
    }
  }

  async loadPayroll(filters: PayrollReportFilters): Promise<void> {
    if (!filters.runId.trim()) {
      this.errorState.set('Payroll run is required.');
      return;
    }

    this.payrollLoadingState.set(true);
    this.clearError();
    try {
      const result = await this.data.getPayrollReport(filters);
      this.payrollRecordsState.set(result.records);
      this.payrollSummaryState.set(result.summary);
      this.payrollRunInfoState.set(result.run);
    } catch (error: unknown) {
      this.payrollRecordsState.set([]);
      this.payrollSummaryState.set(emptyPayrollSummary);
      this.payrollRunInfoState.set(null);
      this.setError(error, 'Unable to load payroll report.');
    } finally {
      this.payrollLoadingState.set(false);
    }
  }

  async loadTax(runId: string): Promise<void> {
    const id = runId.trim();
    if (!id) {
      this.errorState.set('Payroll run is required.');
      return;
    }

    this.taxLoadingState.set(true);
    this.clearError();
    try {
      const result = await this.data.getTaxReport(id);
      this.taxRecordsState.set(result.records);
      this.taxSummaryState.set(result.summary);
      this.taxRunInfoState.set(result.run);
    } catch (error: unknown) {
      this.taxRecordsState.set([]);
      this.taxSummaryState.set(emptyTaxSummary);
      this.taxRunInfoState.set(null);
      this.setError(error, 'Unable to load tax report.');
    } finally {
      this.taxLoadingState.set(false);
    }
  }

  async loadAnalytics(period: AnalyticsPeriod): Promise<void> {
    this.analyticsLoadingState.set(true);
    this.clearError();
    try {
      this.analyticsState.set(await this.data.getAnalytics(period));
    } catch (error: unknown) {
      this.analyticsState.set(null);
      this.setError(error, 'Unable to load workforce analytics.');
    } finally {
      this.analyticsLoadingState.set(false);
    }
  }

  async runDueSchedules(limit = 25): Promise<number> {
    this.scheduleRunningState.set(true);
    this.clearError();
    try {
      return await this.data.runDueSchedules(limit);
    } catch (error: unknown) {
      this.setError(error, 'Unable to run due report schedules.');
      return 0;
    } finally {
      this.scheduleRunningState.set(false);
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private setError(error: unknown, fallback: string): void {
    if (error instanceof Error && error.message.trim().length > 0) {
      this.errorState.set(error.message);
      return;
    }
    this.errorState.set(fallback);
  }
}
