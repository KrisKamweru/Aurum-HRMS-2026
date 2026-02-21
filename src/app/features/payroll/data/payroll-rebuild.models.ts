import { AppRole } from '../../../core/auth/auth.types';

export type PayrollRunStatus = 'draft' | 'processing' | 'completed';
export type PayrollChangeOperation = 'create' | 'update' | 'delete';
export type PayrollReviewDecision = 'approved' | 'rejected';

export interface RebuildPayrollViewerContext {
  role: AppRole;
  employeeId?: string;
}

export interface RebuildPayrollRun {
  id: string;
  month: number;
  year: number;
  status: PayrollRunStatus;
  runDate: string;
  employeeCount: number;
  totalGrossPay: number;
  totalNetPay: number;
  processedBy?: string;
}

export interface RebuildPendingSensitiveChange {
  id: string;
  targetTable: string;
  targetId?: string;
  operation: PayrollChangeOperation;
  reason: string;
  createdAt: string;
  requesterUserId?: string;
}

export interface RebuildPayrollLineItem {
  name: string;
  amount: number;
  type?: string;
}

export interface RebuildPayrollSlip {
  id: string;
  runId: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  basicSalary: number;
  grossSalary: number;
  netSalary: number;
  earnings: RebuildPayrollLineItem[];
  deductions: RebuildPayrollLineItem[];
  employerContributions: RebuildPayrollLineItem[];
  generatedAt: string;
  month?: number;
  year?: number;
}

export interface RebuildPayrollActionResult {
  mode: 'applied' | 'pending';
  changeRequestId?: string;
}

export interface PayrollRunDraftInput {
  month: number;
  year: number;
}

export interface PayrollSensitiveReviewInput {
  changeRequestId: string;
  decision: PayrollReviewDecision;
  rejectionReason?: string;
}

export type PayslipLoadResult = 'loaded' | 'unauthorized' | 'unavailable' | 'error';
