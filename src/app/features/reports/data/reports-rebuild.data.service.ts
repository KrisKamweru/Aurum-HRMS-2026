import { Injectable, inject } from '@angular/core';
import { api } from '../../../../../convex/_generated/api';
import { Id, TableNames } from '../../../../../convex/_generated/dataModel';
import { ConvexClientService } from '../../../core/services/convex-client.service';
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

interface AttendanceReportResult {
  records: AttendanceReportRecord[];
  summary: AttendanceReportSummary;
}

interface PayrollReportResult {
  run: PayrollRunInfo | null;
  records: PayrollReportRecord[];
  summary: PayrollReportSummary;
}

interface TaxReportResult {
  run: PayrollRunInfo | null;
  records: TaxReportRecord[];
  summary: TaxReportSummary;
}

@Injectable({ providedIn: 'root' })
export class ReportsRebuildDataService {
  private readonly convexClient = inject(ConvexClientService);
  private readonly convex = this.convexClient.getHttpClient();

  async getDepartments(): Promise<ReportDepartment[]> {
    const rows = await this.convex.query(api.reports.getDepartments, {});
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapDepartment(row))
      .filter((row): row is ReportDepartment => row !== null);
  }

  async getPayrollRuns(): Promise<ReportPayrollRun[]> {
    const rows = await this.convex.query(api.reports.getPayrollRuns, {});
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapPayrollRun(row))
      .filter((row): row is ReportPayrollRun => row !== null);
  }

  async getAttendanceReport(filters: AttendanceReportFilters): Promise<AttendanceReportResult> {
    const result = await this.convex.query(api.reports.getAttendanceReport, {
      startDate: filters.startDate,
      endDate: filters.endDate,
      departmentId: filters.departmentId ? this.toId('departments', filters.departmentId) : undefined
    });
    return this.mapAttendanceReport(result);
  }

  async getPayrollReport(filters: PayrollReportFilters): Promise<PayrollReportResult> {
    const result = await this.convex.query(api.reports.getPayrollReport, {
      runId: this.toId('payroll_runs', filters.runId),
      departmentId: filters.departmentId ? this.toId('departments', filters.departmentId) : undefined
    });
    return this.mapPayrollReport(result);
  }

  async getTaxReport(runId: string): Promise<TaxReportResult> {
    const result = await this.convex.query(api.reports.getTaxReport, {
      runId: this.toId('payroll_runs', runId)
    });
    return this.mapTaxReport(result);
  }

  async getAnalytics(period: AnalyticsPeriod): Promise<AnalyticsMetrics | null> {
    const result = await this.convex.query(api.reporting_ops.getCanonicalMetrics, { period });
    return this.mapAnalytics(result);
  }

  async runDueSchedules(limit = 25): Promise<number> {
    const result = await this.convex.mutation(api.reporting_ops.runDueReportSchedules, { limit });
    if (!result || typeof result !== 'object') {
      return 0;
    }
    const record = result as Record<string, unknown>;
    return this.readNumber(record['processedCount']);
  }

  private mapDepartment(row: unknown): ReportDepartment | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const value = row as Record<string, unknown>;
    if (typeof value['_id'] !== 'string' || typeof value['name'] !== 'string') {
      return null;
    }
    return {
      id: value['_id'],
      name: value['name'],
      code: typeof value['code'] === 'string' ? value['code'] : undefined
    };
  }

  private mapPayrollRun(row: unknown): ReportPayrollRun | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['month'] !== 'number' ||
      typeof value['year'] !== 'number' ||
      typeof value['label'] !== 'string'
    ) {
      return null;
    }
    return {
      id: value['_id'],
      month: value['month'],
      year: value['year'],
      label: value['label'],
      employeeCount: this.readNumber(value['employeeCount']),
      totalNetPay: this.readNumber(value['totalNetPay'])
    };
  }

  private mapAttendanceReport(result: unknown): AttendanceReportResult {
    if (!result || typeof result !== 'object') {
      return {
        records: [],
        summary: { totalRecords: 0, present: 0, late: 0, absent: 0, halfDay: 0, onLeave: 0, holiday: 0 }
      };
    }
    const value = result as Record<string, unknown>;
    const records = Array.isArray(value['records'])
      ? value['records']
          .map((row) => this.mapAttendanceRecord(row))
          .filter((row): row is AttendanceReportRecord => row !== null)
      : [];
    const summary = this.mapAttendanceSummary(value['summary']);
    return { records, summary };
  }

  private mapAttendanceRecord(row: unknown): AttendanceReportRecord | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['employeeName'] !== 'string' ||
      typeof value['date'] !== 'string' ||
      typeof value['status'] !== 'string'
    ) {
      return null;
    }
    return {
      id: value['_id'],
      employeeName: value['employeeName'],
      employeeNumber: typeof value['employeeNumber'] === 'string' ? value['employeeNumber'] : '',
      department: typeof value['department'] === 'string' ? value['department'] : '',
      date: value['date'],
      status: value['status'],
      clockIn: typeof value['clockIn'] === 'string' ? value['clockIn'] : undefined,
      clockOut: typeof value['clockOut'] === 'string' ? value['clockOut'] : undefined,
      workMinutes: this.readNumber(value['workMinutes']),
      notes: typeof value['notes'] === 'string' ? value['notes'] : ''
    };
  }

  private mapAttendanceSummary(summary: unknown): AttendanceReportSummary {
    if (!summary || typeof summary !== 'object') {
      return { totalRecords: 0, present: 0, late: 0, absent: 0, halfDay: 0, onLeave: 0, holiday: 0 };
    }
    const value = summary as Record<string, unknown>;
    return {
      totalRecords: this.readNumber(value['totalRecords']),
      present: this.readNumber(value['present']),
      late: this.readNumber(value['late']),
      absent: this.readNumber(value['absent']),
      halfDay: this.readNumber(value['half-day']),
      onLeave: this.readNumber(value['on-leave']),
      holiday: this.readNumber(value['holiday'])
    };
  }

  private mapPayrollReport(result: unknown): PayrollReportResult {
    if (!result || typeof result !== 'object') {
      return {
        run: null,
        records: [],
        summary: { employeeCount: 0, totalGross: 0, totalDeductions: 0, totalNet: 0 }
      };
    }
    const value = result as Record<string, unknown>;
    const records = Array.isArray(value['records'])
      ? value['records']
          .map((row) => this.mapPayrollRecord(row))
          .filter((row): row is PayrollReportRecord => row !== null)
      : [];
    return {
      run: this.mapRunInfo(value['run']),
      records,
      summary: this.mapPayrollSummary(value['summary'])
    };
  }

  private mapPayrollRecord(row: unknown): PayrollReportRecord | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const value = row as Record<string, unknown>;
    if (typeof value['_id'] !== 'string' || typeof value['employeeName'] !== 'string') {
      return null;
    }
    return {
      id: value['_id'],
      employeeName: value['employeeName'],
      designation: typeof value['designation'] === 'string' ? value['designation'] : '',
      department: typeof value['department'] === 'string' ? value['department'] : '',
      basicSalary: this.readNumber(value['basicSalary']),
      grossSalary: this.readNumber(value['grossSalary']),
      deductions: this.readNumber(value['deductions']),
      netSalary: this.readNumber(value['netSalary'])
    };
  }

  private mapPayrollSummary(summary: unknown): PayrollReportSummary {
    if (!summary || typeof summary !== 'object') {
      return { employeeCount: 0, totalGross: 0, totalDeductions: 0, totalNet: 0 };
    }
    const value = summary as Record<string, unknown>;
    return {
      employeeCount: this.readNumber(value['employeeCount']),
      totalGross: this.readNumber(value['totalGross']),
      totalDeductions: this.readNumber(value['totalDeductions']),
      totalNet: this.readNumber(value['totalNet'])
    };
  }

  private mapTaxReport(result: unknown): TaxReportResult {
    if (!result || typeof result !== 'object') {
      return {
        run: null,
        records: [],
        summary: {
          employeeCount: 0,
          totalPaye: 0,
          totalNssfEmployee: 0,
          totalNssfEmployer: 0,
          totalNhif: 0,
          totalHousingLevy: 0,
          totalStatutory: 0
        }
      };
    }
    const value = result as Record<string, unknown>;
    const records = Array.isArray(value['records'])
      ? value['records'].map((row) => this.mapTaxRecord(row)).filter((row): row is TaxReportRecord => row !== null)
      : [];
    return {
      run: this.mapRunInfo(value['run']),
      records,
      summary: this.mapTaxSummary(value['summary'])
    };
  }

  private mapTaxRecord(row: unknown): TaxReportRecord | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const value = row as Record<string, unknown>;
    if (typeof value['_id'] !== 'string' || typeof value['employeeName'] !== 'string') {
      return null;
    }
    return {
      id: value['_id'],
      employeeName: value['employeeName'],
      kraPin: typeof value['kraPin'] === 'string' ? value['kraPin'] : '',
      nhifNumber: typeof value['nhifNumber'] === 'string' ? value['nhifNumber'] : '',
      nssfNumber: typeof value['nssfNumber'] === 'string' ? value['nssfNumber'] : '',
      grossSalary: this.readNumber(value['grossSalary']),
      taxableIncome: this.readNumber(value['taxableIncome']),
      paye: this.readNumber(value['paye']),
      nssfEmployee: this.readNumber(value['nssfEmployee']),
      nssfEmployer: this.readNumber(value['nssfEmployer']),
      nhif: this.readNumber(value['nhif']),
      housingLevy: this.readNumber(value['housingLevy'])
    };
  }

  private mapTaxSummary(summary: unknown): TaxReportSummary {
    if (!summary || typeof summary !== 'object') {
      return {
        employeeCount: 0,
        totalPaye: 0,
        totalNssfEmployee: 0,
        totalNssfEmployer: 0,
        totalNhif: 0,
        totalHousingLevy: 0,
        totalStatutory: 0
      };
    }
    const value = summary as Record<string, unknown>;
    return {
      employeeCount: this.readNumber(value['employeeCount']),
      totalPaye: this.readNumber(value['totalPaye']),
      totalNssfEmployee: this.readNumber(value['totalNssfEmployee']),
      totalNssfEmployer: this.readNumber(value['totalNssfEmployer']),
      totalNhif: this.readNumber(value['totalNhif']),
      totalHousingLevy: this.readNumber(value['totalHousingLevy']),
      totalStatutory: this.readNumber(value['totalStatutory'])
    };
  }

  private mapRunInfo(run: unknown): PayrollRunInfo | null {
    if (!run || typeof run !== 'object') {
      return null;
    }
    const value = run as Record<string, unknown>;
    if (
      typeof value['month'] !== 'number' ||
      typeof value['year'] !== 'number' ||
      typeof value['status'] !== 'string' ||
      typeof value['runDate'] !== 'string'
    ) {
      return null;
    }
    return {
      month: value['month'],
      year: value['year'],
      status: value['status'],
      runDate: value['runDate']
    };
  }

  private mapAnalytics(result: unknown): AnalyticsMetrics | null {
    if (!result || typeof result !== 'object') {
      return null;
    }
    const value = result as Record<string, unknown>;
    if (
      !this.isAnalyticsPeriod(value['period']) ||
      typeof value['startDate'] !== 'string' ||
      typeof value['endDate'] !== 'string'
    ) {
      return null;
    }
    return {
      period: value['period'],
      startDate: value['startDate'],
      endDate: value['endDate'],
      headcount: this.readNumber(value['headcount']),
      attritionCount: this.readNumber(value['attritionCount']),
      attritionRate: this.readNumber(value['attritionRate']),
      leaveLiabilityDays: this.readNumber(value['leaveLiabilityDays']),
      payrollVarianceAmount: this.readNumber(value['payrollVarianceAmount']),
      payrollVariancePercent: this.readNumber(value['payrollVariancePercent'])
    };
  }

  private isAnalyticsPeriod(value: unknown): value is AnalyticsPeriod {
    return value === 'daily' || value === 'weekly' || value === 'monthly' || value === 'quarterly';
  }

  private readNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private toId<T extends TableNames>(table: T, value: string): Id<T> {
    void table;
    return value as Id<T>;
  }
}
