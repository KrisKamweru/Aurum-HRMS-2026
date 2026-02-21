import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { api } from '../../../../../convex/_generated/api';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { ReportsRebuildDataService } from './reports-rebuild.data.service';

describe('ReportsRebuildDataService', () => {
  let service: ReportsRebuildDataService;
  let query: ReturnType<typeof vi.fn>;
  let mutation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn(async () => null);
    mutation = vi.fn(async () => null);

    TestBed.configureTestingModule({
      providers: [
        ReportsRebuildDataService,
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

    service = TestBed.inject(ReportsRebuildDataService);
  });

  it('maps filter options and attendance report payloads', async () => {
    query.mockResolvedValueOnce([{ _id: 'dept-1', name: 'Finance', code: 'FIN' }]);
    query.mockResolvedValueOnce([{ _id: 'run-1', month: 2, year: 2026, label: 'February 2026', employeeCount: 1 }]);
    query.mockResolvedValueOnce({
      records: [
        {
          _id: 'att-1',
          employeeName: 'Amina Said',
          employeeNumber: 'EMP-1',
          department: 'Finance',
          date: '2026-02-21',
          status: 'present',
          clockIn: '2026-02-21T08:00:00.000Z',
          clockOut: '2026-02-21T17:00:00.000Z',
          workMinutes: 540,
          notes: ''
        }
      ],
      summary: {
        totalRecords: 1,
        present: 1,
        late: 0,
        absent: 0,
        'half-day': 0,
        'on-leave': 0,
        holiday: 0
      }
    });

    const departments = await service.getDepartments();
    const runs = await service.getPayrollRuns();
    const attendance = await service.getAttendanceReport({
      startDate: '2026-02-01',
      endDate: '2026-02-29',
      departmentId: 'dept-1'
    });

    expect(departments[0]?.name).toBe('Finance');
    expect(runs[0]?.label).toBe('February 2026');
    expect(attendance.records[0]?.employeeName).toBe('Amina Said');
    expect(attendance.summary.totalRecords).toBe(1);
    expect(query).toHaveBeenNthCalledWith(3, api.reports.getAttendanceReport, {
      startDate: '2026-02-01',
      endDate: '2026-02-29',
      departmentId: 'dept-1'
    });
  });

  it('maps payroll/tax/analytics responses and schedule run mutations', async () => {
    query.mockResolvedValueOnce({
      run: { month: 2, year: 2026, status: 'completed', runDate: '2026-02-28' },
      records: [{ _id: 'slip-1', employeeName: 'Amina Said', grossSalary: 200000, deductions: 20000, netSalary: 180000 }],
      summary: { employeeCount: 1, totalGross: 200000, totalDeductions: 20000, totalNet: 180000 }
    });
    query.mockResolvedValueOnce({
      run: { month: 2, year: 2026, status: 'completed', runDate: '2026-02-28' },
      records: [{ _id: 'tax-1', employeeName: 'Amina Said', paye: 10000 }],
      summary: { employeeCount: 1, totalPaye: 10000, totalStatutory: 15000 }
    });
    query.mockResolvedValueOnce({
      period: 'monthly',
      startDate: '2026-02-01',
      endDate: '2026-02-29',
      headcount: 42,
      attritionCount: 1,
      attritionRate: 0.023,
      leaveLiabilityDays: 8,
      payrollVarianceAmount: 1200,
      payrollVariancePercent: 0.01
    });
    mutation.mockResolvedValueOnce({ processedCount: 3 });

    const payroll = await service.getPayrollReport({ runId: 'run-1' });
    const tax = await service.getTaxReport('run-1');
    const analytics = await service.getAnalytics('monthly');
    const processed = await service.runDueSchedules(25);

    expect(payroll.summary.totalNet).toBe(180000);
    expect(tax.summary.totalPaye).toBe(10000);
    expect(analytics?.headcount).toBe(42);
    expect(processed).toBe(3);
    expect(mutation).toHaveBeenCalledWith(api.reporting_ops.runDueReportSchedules, { limit: 25 });
  });
});
