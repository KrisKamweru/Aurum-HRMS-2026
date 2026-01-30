/**
 * Report Definitions - Extensible registry for report types
 *
 * This structure allows for future custom reports (e.g., ITAX P10 format)
 * to be added without modifying core infrastructure.
 */

export type ReportCategory = 'core' | 'tax' | 'custom';
export type ExportFormat = 'csv' | 'pdf' | 'xlsx';

export interface FilterConfig {
  type: 'dateRange' | 'department' | 'payrollRun' | 'employee';
  required: boolean;
  label: string;
}

export interface ColumnConfig {
  key: string;
  header: string;
  type: 'text' | 'date' | 'currency' | 'number' | 'badge';
  width?: string;
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  icon: string;
  route: string;
  filters: FilterConfig[];
  columns: ColumnConfig[];
  exportFormats: ExportFormat[];
}

/**
 * Core report definitions
 */
export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 'attendance',
    name: 'Attendance Report',
    description: 'Track employee attendance, clock-in/out times, and work hours for any date range',
    category: 'core',
    icon: 'clock',
    route: '/reports/attendance',
    filters: [
      { type: 'dateRange', required: true, label: 'Date Range' },
      { type: 'department', required: false, label: 'Department' },
    ],
    columns: [
      { key: 'employeeName', header: 'Employee', type: 'text' },
      { key: 'department', header: 'Department', type: 'text' },
      { key: 'date', header: 'Date', type: 'date' },
      { key: 'status', header: 'Status', type: 'badge' },
      { key: 'clockIn', header: 'Clock In', type: 'text' },
      { key: 'clockOut', header: 'Clock Out', type: 'text' },
      { key: 'workMinutes', header: 'Duration', type: 'text' },
    ],
    exportFormats: ['csv'],
  },
  {
    id: 'payroll',
    name: 'Payroll Report',
    description: 'View salary breakdown, earnings, and deductions for completed payroll runs',
    category: 'core',
    icon: 'banknotes',
    route: '/reports/payroll',
    filters: [
      { type: 'payrollRun', required: true, label: 'Payroll Period' },
      { type: 'department', required: false, label: 'Department' },
    ],
    columns: [
      { key: 'employeeName', header: 'Employee', type: 'text' },
      { key: 'designation', header: 'Designation', type: 'text' },
      { key: 'department', header: 'Department', type: 'text' },
      { key: 'grossSalary', header: 'Gross', type: 'currency' },
      { key: 'deductions', header: 'Deductions', type: 'currency' },
      { key: 'netSalary', header: 'Net Pay', type: 'currency' },
    ],
    exportFormats: ['csv'],
  },
  {
    id: 'tax',
    name: 'Tax Deductions Report',
    description: 'Statutory deductions breakdown: PAYE, NSSF, NHIF, and Housing Levy per employee',
    category: 'tax',
    icon: 'document-text',
    route: '/reports/tax',
    filters: [
      { type: 'payrollRun', required: true, label: 'Payroll Period' },
    ],
    columns: [
      { key: 'employeeName', header: 'Employee', type: 'text' },
      { key: 'kraPin', header: 'KRA PIN', type: 'text' },
      { key: 'grossSalary', header: 'Gross', type: 'currency' },
      { key: 'taxableIncome', header: 'Taxable', type: 'currency' },
      { key: 'paye', header: 'PAYE', type: 'currency' },
      { key: 'nssfEmployee', header: 'NSSF (Emp)', type: 'currency' },
      { key: 'nssfEmployer', header: 'NSSF (ER)', type: 'currency' },
      { key: 'nhif', header: 'NHIF', type: 'currency' },
      { key: 'housingLevy', header: 'Housing', type: 'currency' },
    ],
    exportFormats: ['csv'],
  },
];

/**
 * Get report definition by ID
 */
export function getReportDefinition(id: string): ReportDefinition | undefined {
  return REPORT_DEFINITIONS.find(r => r.id === id);
}

/**
 * Get reports by category
 */
export function getReportsByCategory(category: ReportCategory): ReportDefinition[] {
  return REPORT_DEFINITIONS.filter(r => r.category === category);
}
