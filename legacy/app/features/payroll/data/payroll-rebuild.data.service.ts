import { Injectable, inject } from '@angular/core';
import { api } from '../../../../../convex/_generated/api';
import { Id, TableNames } from '../../../../../convex/_generated/dataModel';
import { AppRole } from '../../../core/auth/auth.types';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import {
  PayrollReviewDecision,
  RebuildPayrollActionResult,
  RebuildPayrollLineItem,
  RebuildPayrollRun,
  RebuildPayrollSlip,
  RebuildPayrollViewerContext,
  RebuildPendingSensitiveChange,
  PayrollChangeOperation,
  PayrollRunStatus
} from './payroll-rebuild.models';

@Injectable({ providedIn: 'root' })
export class PayrollRebuildDataService {
  private readonly convexClient = inject(ConvexClientService);
  private readonly convex = this.convexClient.getHttpClient();

  async getViewerContext(): Promise<RebuildPayrollViewerContext> {
    const viewer = await this.convex.query(api.users.viewer, {});
    if (!viewer || typeof viewer !== 'object') {
      return { role: 'pending' };
    }

    const record = viewer as Record<string, unknown>;
    return {
      role: this.normalizeRole(record['role']),
      employeeId: typeof record['employeeId'] === 'string' ? record['employeeId'] : undefined
    };
  }

  async listRuns(): Promise<RebuildPayrollRun[]> {
    const rows = await this.convex.query(api.payroll.listRuns, {});
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapRun(row))
      .filter((row): row is RebuildPayrollRun => row !== null);
  }

  async listPendingSensitiveChanges(): Promise<RebuildPendingSensitiveChange[]> {
    const rows = await this.convex.query(api.payroll.listPendingSensitiveChanges, {});
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapPendingChange(row))
      .filter((row): row is RebuildPendingSensitiveChange => row !== null);
  }

  async createRun(month: number, year: number): Promise<string> {
    const id = await this.convex.mutation(api.payroll.createRun, {
      month,
      year
    });
    return typeof id === 'string' ? id : '';
  }

  async getRun(runId: string): Promise<RebuildPayrollRun | null> {
    const run = await this.convex.query(api.payroll.getRun, {
      id: this.toId('payroll_runs', runId)
    });
    return this.mapRun(run);
  }

  async listRunSlips(runId: string): Promise<RebuildPayrollSlip[]> {
    const slips = await this.convex.query(api.payroll.getRunSlips, {
      runId: this.toId('payroll_runs', runId)
    });
    if (!Array.isArray(slips)) {
      return [];
    }
    return slips
      .map((slip) => this.mapSlip(slip))
      .filter((slip): slip is RebuildPayrollSlip => slip !== null);
  }

  async processRun(runId: string): Promise<void> {
    await this.convex.mutation(api.payroll.processRun, {
      runId: this.toId('payroll_runs', runId)
    });
  }

  async finalizeRun(runId: string, reason?: string): Promise<RebuildPayrollActionResult> {
    const response = await this.convex.mutation(api.payroll.finalizeRun, {
      runId: this.toId('payroll_runs', runId),
      reason: this.normalizeOptionalText(reason)
    });
    return this.mapActionResult(response);
  }

  async deleteRun(runId: string, reason?: string): Promise<RebuildPayrollActionResult> {
    const response = await this.convex.mutation(api.payroll.deleteRun, {
      runId: this.toId('payroll_runs', runId),
      reason: this.normalizeOptionalText(reason)
    });
    return this.mapActionResult(response);
  }

  async reviewSensitiveChange(
    changeRequestId: string,
    decision: PayrollReviewDecision,
    rejectionReason?: string
  ): Promise<void> {
    await this.convex.mutation(api.payroll.reviewSensitiveChange, {
      changeRequestId: this.toId('change_requests', changeRequestId),
      decision,
      rejectionReason: this.normalizeOptionalText(rejectionReason)
    });
  }

  async getPayslip(slipId: string): Promise<RebuildPayrollSlip | null> {
    const slip = await this.convex.query(api.payroll.getPayslip, {
      slipId: this.toId('salary_slips', slipId)
    });
    return this.mapSlip(slip);
  }

  private mapRun(row: unknown): RebuildPayrollRun | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      !this.isRunStatus(value['status']) ||
      typeof value['month'] !== 'number' ||
      typeof value['year'] !== 'number'
    ) {
      return null;
    }

    return {
      id: value['_id'],
      month: value['month'],
      year: value['year'],
      status: value['status'],
      runDate: typeof value['runDate'] === 'string' ? value['runDate'] : '',
      employeeCount: this.readNumber(value['employeeCount']),
      totalGrossPay: this.readNumber(value['totalGrossPay']),
      totalNetPay: this.readNumber(value['totalNetPay']),
      processedBy: typeof value['processedBy'] === 'string' ? value['processedBy'] : undefined
    };
  }

  private mapPendingChange(row: unknown): RebuildPendingSensitiveChange | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['targetTable'] !== 'string' ||
      !this.isChangeOperation(value['operation'])
    ) {
      return null;
    }

    return {
      id: value['_id'],
      targetTable: value['targetTable'],
      targetId: typeof value['targetId'] === 'string' ? value['targetId'] : undefined,
      operation: value['operation'],
      reason: typeof value['reason'] === 'string' ? value['reason'] : '',
      createdAt: typeof value['createdAt'] === 'string' ? value['createdAt'] : '',
      requesterUserId: typeof value['requesterUserId'] === 'string' ? value['requesterUserId'] : undefined
    };
  }

  private mapSlip(row: unknown): RebuildPayrollSlip | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['runId'] !== 'string' ||
      typeof value['employeeId'] !== 'string' ||
      typeof value['employeeName'] !== 'string'
    ) {
      return null;
    }

    return {
      id: value['_id'],
      runId: value['runId'],
      employeeId: value['employeeId'],
      employeeName: value['employeeName'],
      designation: typeof value['designation'] === 'string' ? value['designation'] : '',
      department: typeof value['department'] === 'string' ? value['department'] : '',
      basicSalary: this.readNumber(value['basicSalary']),
      grossSalary: this.readNumber(value['grossSalary']),
      netSalary: this.readNumber(value['netSalary']),
      earnings: this.mapLineItems(value['earnings']),
      deductions: this.mapLineItems(value['deductions']),
      employerContributions: this.mapLineItems(value['employerContributions']),
      generatedAt: typeof value['generatedAt'] === 'string' ? value['generatedAt'] : '',
      month: typeof value['month'] === 'number' ? value['month'] : undefined,
      year: typeof value['year'] === 'number' ? value['year'] : undefined
    };
  }

  private mapLineItems(value: unknown): RebuildPayrollLineItem[] {
    if (!Array.isArray(value)) {
      return [];
    }
    const lines: RebuildPayrollLineItem[] = [];
    for (const item of value) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const record = item as Record<string, unknown>;
      if (typeof record['name'] !== 'string') {
        continue;
      }
      const line: RebuildPayrollLineItem = {
        name: record['name'],
        amount: this.readNumber(record['amount'])
      };
      if (typeof record['type'] === 'string') {
        line.type = record['type'];
      }
      lines.push(line);
    }
    return lines;
  }

  private mapActionResult(value: unknown): RebuildPayrollActionResult {
    if (!value || typeof value !== 'object') {
      return { mode: 'applied' };
    }
    const record = value as Record<string, unknown>;
    const mode = record['mode'] === 'pending' ? 'pending' : 'applied';
    return {
      mode,
      changeRequestId: typeof record['changeRequestId'] === 'string' ? record['changeRequestId'] : undefined
    };
  }

  private isRunStatus(value: unknown): value is PayrollRunStatus {
    return value === 'draft' || value === 'processing' || value === 'completed';
  }

  private isChangeOperation(value: unknown): value is PayrollChangeOperation {
    return value === 'create' || value === 'update' || value === 'delete';
  }

  private normalizeRole(role: unknown): AppRole {
    switch (role) {
      case 'super_admin':
      case 'admin':
      case 'hr_manager':
      case 'manager':
      case 'employee':
      case 'pending':
        return role;
      default:
        return 'pending';
    }
  }

  private normalizeOptionalText(value: string | undefined): string | undefined {
    if (!value) {
      return undefined;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private readNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private toId<Table extends TableNames>(table: Table, value: string): Id<Table> {
    return value as Id<Table>;
  }
}
