import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { api } from '../../../../../convex/_generated/api';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { PayrollRebuildDataService } from './payroll-rebuild.data.service';

describe('PayrollRebuildDataService', () => {
  let service: PayrollRebuildDataService;
  let query: ReturnType<typeof vi.fn>;
  let mutation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn(async () => null);
    mutation = vi.fn(async () => null);

    TestBed.configureTestingModule({
      providers: [
        PayrollRebuildDataService,
        {
          provide: ConvexClientService,
          useValue: {
            getHttpClient: () => ({
              query,
              mutation
            })
          }
        }
      ]
    });

    service = TestBed.inject(PayrollRebuildDataService);
  });

  it('maps viewer, runs, and pending sensitive changes', async () => {
    query.mockResolvedValueOnce({ role: 'hr_manager', employeeId: 'emp-hr' });
    query.mockResolvedValueOnce([
      {
        _id: 'run-1',
        month: 2,
        year: 2026,
        status: 'draft',
        runDate: '2026-02-25T00:00:00.000Z',
        employeeCount: 24,
        totalGrossPay: 500000,
        totalNetPay: 420000
      }
    ]);
    query.mockResolvedValueOnce([
      {
        _id: 'change-1',
        targetTable: 'payroll_runs',
        operation: 'update',
        reason: 'Finalize February payroll',
        createdAt: '2026-02-25T09:00:00.000Z'
      }
    ]);

    const viewer = await service.getViewerContext();
    const runs = await service.listRuns();
    const changes = await service.listPendingSensitiveChanges();

    expect(viewer).toEqual({ role: 'hr_manager', employeeId: 'emp-hr' });
    expect(runs[0]?.id).toBe('run-1');
    expect(runs[0]?.status).toBe('draft');
    expect(changes[0]?.id).toBe('change-1');
    expect(changes[0]?.operation).toBe('update');
  });

  it('maps run detail, run slips, and payslip payloads', async () => {
    query.mockResolvedValueOnce({
      _id: 'run-1',
      month: 2,
      year: 2026,
      status: 'processing',
      runDate: '2026-02-25T00:00:00.000Z'
    });
    query.mockResolvedValueOnce([
      {
        _id: 'slip-1',
        runId: 'run-1',
        employeeId: 'emp-1',
        employeeName: 'Amina Hassan',
        basicSalary: 100000,
        grossSalary: 120000,
        netSalary: 102000,
        earnings: [{ name: 'Basic Salary', amount: 100000, type: 'basic' }],
        deductions: [{ name: 'PAYE', amount: 18000, type: 'tax' }],
        employerContributions: [{ name: 'NSSF Employer', amount: 6000, type: 'nssf_employer' }],
        generatedAt: '2026-02-25T09:00:00.000Z'
      }
    ]);
    query.mockResolvedValueOnce({
      _id: 'slip-1',
      runId: 'run-1',
      employeeId: 'emp-1',
      employeeName: 'Amina Hassan',
      basicSalary: 100000,
      grossSalary: 120000,
      netSalary: 102000,
      earnings: [{ name: 'Basic Salary', amount: 100000, type: 'basic' }],
      deductions: [{ name: 'PAYE', amount: 18000, type: 'tax' }],
      employerContributions: [{ name: 'NSSF Employer', amount: 6000, type: 'nssf_employer' }],
      generatedAt: '2026-02-25T09:00:00.000Z',
      month: 2,
      year: 2026
    });

    const run = await service.getRun('run-1');
    const slips = await service.listRunSlips('run-1');
    const payslip = await service.getPayslip('slip-1');

    expect(run?.status).toBe('processing');
    expect(slips[0]?.earnings[0]?.name).toBe('Basic Salary');
    expect(payslip?.month).toBe(2);
  });

  it('submits payroll mutations with typed args and maps action modes', async () => {
    mutation.mockResolvedValueOnce('run-100');
    mutation.mockResolvedValueOnce(undefined);
    mutation.mockResolvedValueOnce({ mode: 'pending', changeRequestId: 'change-42' });
    mutation.mockResolvedValueOnce({ mode: 'applied', changeRequestId: 'change-77' });
    mutation.mockResolvedValueOnce(undefined);

    const runId = await service.createRun(3, 2026);
    await service.processRun('run-100');
    const finalizeResult = await service.finalizeRun('run-100', 'All checks complete');
    const deleteResult = await service.deleteRun('run-100', 'Incorrect cycle');
    await service.reviewSensitiveChange('change-99', 'rejected', 'Dual control declined');

    expect(runId).toBe('run-100');
    expect(finalizeResult).toEqual({ mode: 'pending', changeRequestId: 'change-42' });
    expect(deleteResult).toEqual({ mode: 'applied', changeRequestId: 'change-77' });
    expect(mutation).toHaveBeenNthCalledWith(1, api.payroll.createRun, { month: 3, year: 2026 });
    expect(mutation).toHaveBeenNthCalledWith(2, api.payroll.processRun, { runId: 'run-100' });
    expect(mutation).toHaveBeenNthCalledWith(3, api.payroll.finalizeRun, {
      runId: 'run-100',
      reason: 'All checks complete'
    });
    expect(mutation).toHaveBeenNthCalledWith(4, api.payroll.deleteRun, {
      runId: 'run-100',
      reason: 'Incorrect cycle'
    });
    expect(mutation).toHaveBeenNthCalledWith(5, api.payroll.reviewSensitiveChange, {
      changeRequestId: 'change-99',
      decision: 'rejected',
      rejectionReason: 'Dual control declined'
    });
  });
});
