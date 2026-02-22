export interface ReportDepartment {
  id: string;
  name: string;
  code?: string;
}

export interface ReportPayrollRun {
  id: string;
  month: number;
  year: number;
  label: string;
  employeeCount: number;
  totalNetPay: number;
}

export interface AttendanceReportFilters {
  startDate: string;
  endDate: string;
  departmentId?: string;
}

export interface AttendanceReportRecord extends Record<string, unknown> {
  id: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  date: string;
  status: string;
  clockIn?: string;
  clockOut?: string;
  workMinutes: number;
  notes: string;
}

export interface AttendanceReportSummary {
  totalRecords: number;
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  onLeave: number;
  holiday: number;
}

export interface PayrollReportFilters {
  runId: string;
  departmentId?: string;
}

export interface PayrollReportRecord extends Record<string, unknown> {
  id: string;
  employeeName: string;
  designation: string;
  department: string;
  basicSalary: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
}

export interface PayrollRunInfo {
  month: number;
  year: number;
  status: string;
  runDate: string;
}

export interface PayrollReportSummary {
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
}

export interface TaxReportRecord extends Record<string, unknown> {
  id: string;
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

export interface TaxReportSummary {
  employeeCount: number;
  totalPaye: number;
  totalNssfEmployee: number;
  totalNssfEmployer: number;
  totalNhif: number;
  totalHousingLevy: number;
  totalStatutory: number;
}

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface AnalyticsMetrics {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  headcount: number;
  attritionCount: number;
  attritionRate: number;
  leaveLiabilityDays: number;
  payrollVarianceAmount: number;
  payrollVariancePercent: number;
}
