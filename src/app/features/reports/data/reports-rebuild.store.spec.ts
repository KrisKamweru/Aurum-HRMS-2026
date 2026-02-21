import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ReportsRebuildDataService } from './reports-rebuild.data.service';
import { ReportsRebuildStore } from './reports-rebuild.store';

describe('ReportsRebuildStore', () => {
  let store: ReportsRebuildStore;
  let dataService: {
    getDepartments: ReturnType<typeof vi.fn>;
    getPayrollRuns: ReturnType<typeof vi.fn>;
    getAttendanceReport: ReturnType<typeof vi.fn>;
    getPayrollReport: ReturnType<typeof vi.fn>;
    getTaxReport: ReturnType<typeof vi.fn>;
    getAnalytics: ReturnType<typeof vi.fn>;
    runDueSchedules: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      getDepartments: vi.fn(async () => [{ id: 'dept-1', name: 'Finance' }]),
      getPayrollRuns: vi.fn(async () => [{ id: 'run-1', month: 2, year: 2026, label: 'February 2026', employeeCount: 1, totalNetPay: 1 }]),
      getAttendanceReport: vi.fn(async () => ({
        records: [{ id: 'att-1', employeeName: 'Amina', employeeNumber: 'E-1', department: 'Finance', date: '2026-02-21', status: 'present', workMinutes: 480, notes: '' }],
        summary: { totalRecords: 1, present: 1, late: 0, absent: 0, halfDay: 0, onLeave: 0, holiday: 0 }
      })),
      getPayrollReport: vi.fn(async () => ({
        run: { month: 2, year: 2026, status: 'completed', runDate: '2026-02-28' },
        records: [{ id: 'slip-1', employeeName: 'Amina', designation: 'Analyst', department: 'Finance', basicSalary: 100000, grossSalary: 100000, deductions: 5000, netSalary: 95000 }],
        summary: { employeeCount: 1, totalGross: 100000, totalDeductions: 5000, totalNet: 95000 }
      })),
      getTaxReport: vi.fn(async () => ({
        run: { month: 2, year: 2026, status: 'completed', runDate: '2026-02-28' },
        records: [{ id: 'tax-1', employeeName: 'Amina', kraPin: 'A123', nhifNumber: '', nssfNumber: '', grossSalary: 100000, taxableIncome: 95000, paye: 10000, nssfEmployee: 500, nssfEmployer: 500, nhif: 400, housingLevy: 200 }],
        summary: { employeeCount: 1, totalPaye: 10000, totalNssfEmployee: 500, totalNssfEmployer: 500, totalNhif: 400, totalHousingLevy: 200, totalStatutory: 11600 }
      })),
      getAnalytics: vi.fn(async () => ({
        period: 'monthly',
        startDate: '2026-02-01',
        endDate: '2026-02-29',
        headcount: 10,
        attritionCount: 1,
        attritionRate: 0.1,
        leaveLiabilityDays: 3,
        payrollVarianceAmount: 1200,
        payrollVariancePercent: 0.05
      })),
      runDueSchedules: vi.fn(async () => 2)
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ReportsRebuildDataService, useValue: dataService }]
    });

    store = TestBed.inject(ReportsRebuildStore);
  });

  it('loads departments and payroll runs', async () => {
    await store.loadFilterOptions();

    expect(store.departments().length).toBe(1);
    expect(store.payrollRuns().length).toBe(1);
  });

  it('loads attendance report state', async () => {
    await store.loadAttendance({ startDate: '2026-02-01', endDate: '2026-02-29' });

    expect(store.attendanceRecords().length).toBe(1);
    expect(store.attendanceSummary().totalRecords).toBe(1);
  });

  it('loads payroll and tax report state', async () => {
    await store.loadPayroll({ runId: 'run-1' });
    await store.loadTax('run-1');

    expect(store.payrollSummary().totalNet).toBe(95000);
    expect(store.taxSummary().totalStatutory).toBe(11600);
  });

  it('loads analytics and runs schedule processing', async () => {
    await store.loadAnalytics('monthly');
    const processed = await store.runDueSchedules();

    expect(store.analytics()?.headcount).toBe(10);
    expect(processed).toBe(2);
  });
});
