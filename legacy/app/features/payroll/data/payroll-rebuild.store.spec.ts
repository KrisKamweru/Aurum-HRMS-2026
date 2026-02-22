import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PayrollRebuildDataService } from './payroll-rebuild.data.service';
import { PayrollRebuildStore } from './payroll-rebuild.store';

describe('PayrollRebuildStore', () => {
  let store: PayrollRebuildStore;
  let dataService: {
    getViewerContext: ReturnType<typeof vi.fn>;
    listRuns: ReturnType<typeof vi.fn>;
    listPendingSensitiveChanges: ReturnType<typeof vi.fn>;
    createRun: ReturnType<typeof vi.fn>;
    getRun: ReturnType<typeof vi.fn>;
    listRunSlips: ReturnType<typeof vi.fn>;
    processRun: ReturnType<typeof vi.fn>;
    finalizeRun: ReturnType<typeof vi.fn>;
    deleteRun: ReturnType<typeof vi.fn>;
    reviewSensitiveChange: ReturnType<typeof vi.fn>;
    getPayslip: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      getViewerContext: vi.fn(async () => ({ role: 'hr_manager', employeeId: 'emp-hr' })),
      listRuns: vi.fn(async () => [
        {
          id: 'run-1',
          month: 2,
          year: 2026,
          status: 'processing',
          runDate: '2026-02-25T00:00:00.000Z',
          employeeCount: 20,
          totalGrossPay: 1000000,
          totalNetPay: 840000,
          processedBy: 'user-1'
        }
      ]),
      listPendingSensitiveChanges: vi.fn(async () => [
        {
          id: 'change-1',
          targetTable: 'payroll_runs',
          operation: 'update',
          reason: 'Finalize February payroll',
          createdAt: '2026-02-25T10:00:00.000Z'
        }
      ]),
      createRun: vi.fn(async () => 'run-2'),
      getRun: vi.fn(async () => ({
        id: 'run-1',
        month: 2,
        year: 2026,
        status: 'processing',
        runDate: '2026-02-25T00:00:00.000Z',
        employeeCount: 20,
        totalGrossPay: 1000000,
        totalNetPay: 840000,
        processedBy: 'user-1'
      })),
      listRunSlips: vi.fn(async () => [
        {
          id: 'slip-1',
          runId: 'run-1',
          employeeId: 'emp-1',
          employeeName: 'Amina Hassan',
          designation: 'Finance Analyst',
          department: 'Finance',
          basicSalary: 100000,
          grossSalary: 120000,
          netSalary: 102000,
          earnings: [{ name: 'Basic Salary', amount: 100000 }],
          deductions: [{ name: 'PAYE', amount: 18000 }],
          employerContributions: [{ name: 'NSSF Employer', amount: 6000 }],
          generatedAt: '2026-02-25T12:00:00.000Z'
        }
      ]),
      processRun: vi.fn(async () => undefined),
      finalizeRun: vi.fn(async () => ({ mode: 'pending', changeRequestId: 'change-2' })),
      deleteRun: vi.fn(async () => ({ mode: 'applied', changeRequestId: 'change-3' })),
      reviewSensitiveChange: vi.fn(async () => undefined),
      getPayslip: vi.fn(async () => ({
        id: 'slip-1',
        runId: 'run-1',
        employeeId: 'emp-1',
        employeeName: 'Amina Hassan',
        designation: 'Finance Analyst',
        department: 'Finance',
        basicSalary: 100000,
        grossSalary: 120000,
        netSalary: 102000,
        earnings: [{ name: 'Basic Salary', amount: 100000 }],
        deductions: [{ name: 'PAYE', amount: 18000 }],
        employerContributions: [{ name: 'NSSF Employer', amount: 6000 }],
        generatedAt: '2026-02-25T12:00:00.000Z',
        month: 2,
        year: 2026
      }))
    };

    TestBed.configureTestingModule({
      providers: [{ provide: PayrollRebuildDataService, useValue: dataService }]
    });

    store = TestBed.inject(PayrollRebuildStore);
  });

  it('loads payroll home state and computes summary counters', async () => {
    await store.loadPayrollHome();

    expect(store.canManage()).toBe(true);
    expect(store.runs().length).toBe(1);
    expect(store.pendingChanges().length).toBe(1);
    expect(store.pendingRunCount()).toBe(1);
  });

  it('creates payroll run with validation', async () => {
    const invalid = await store.createRun({ month: 13, year: 2026 });
    const valid = await store.createRun({ month: 3, year: 2026 });

    expect(invalid).toBeNull();
    expect(valid).toBe('run-2');
    expect(dataService.createRun).toHaveBeenCalledWith(3, 2026);
  });

  it('loads run details and supports process/finalize/delete actions', async () => {
    await store.loadRun('run-1');
    expect(store.selectedRun()?.id).toBe('run-1');
    expect(store.runSlips().length).toBe(1);

    const processed = await store.processRun('run-1');
    const finalized = await store.finalizeRun('run-1', 'Dual-control ready');
    const deleted = await store.deleteRun('run-1', 'Cycle created in error');

    expect(processed).toBe(true);
    expect(finalized?.mode).toBe('pending');
    expect(deleted?.mode).toBe('applied');
    expect(dataService.processRun).toHaveBeenCalledWith('run-1');
    expect(dataService.finalizeRun).toHaveBeenCalledWith('run-1', 'Dual-control ready');
    expect(dataService.deleteRun).toHaveBeenCalledWith('run-1', 'Cycle created in error');
  });

  it('enforces rejection reasons for sensitive change review', async () => {
    const invalid = await store.reviewSensitiveChange({
      changeRequestId: 'change-1',
      decision: 'rejected',
      rejectionReason: '   '
    });
    const valid = await store.reviewSensitiveChange({
      changeRequestId: 'change-1',
      decision: 'approved'
    });

    expect(invalid).toBe(false);
    expect(valid).toBe(true);
    expect(dataService.reviewSensitiveChange).toHaveBeenCalledWith('change-1', 'approved', undefined);
  });

  it('loads payslips and maps unauthorized errors', async () => {
    const loaded = await store.loadPayslip('slip-1');
    expect(loaded).toBe('loaded');
    expect(store.selectedPayslip()?.id).toBe('slip-1');

    dataService.getPayslip.mockRejectedValueOnce(new Error('Unauthorized'));
    const unauthorized = await store.loadPayslip('slip-1');

    expect(unauthorized).toBe('unauthorized');
    expect(store.error()).toContain('permission');
  });
});
