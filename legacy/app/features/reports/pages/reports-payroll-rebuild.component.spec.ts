import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ReportsCsvExportService } from '../data/reports-csv-export.service';
import { ReportsRebuildStore } from '../data/reports-rebuild.store';
import { ReportsPayrollRebuildComponent } from './reports-payroll-rebuild.component';

describe('ReportsPayrollRebuildComponent', () => {
  let fixture: ComponentFixture<ReportsPayrollRebuildComponent>;
  let component: ReportsPayrollRebuildComponent;
  let storeMock: Pick<
    ReportsRebuildStore,
    | 'departments'
    | 'payrollRuns'
    | 'payrollRecords'
    | 'payrollSummary'
    | 'payrollRunInfo'
    | 'payrollLoading'
    | 'error'
    | 'loadFilterOptions'
    | 'loadPayroll'
  >;
  let csvMock: { exportRows: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    storeMock = {
      departments: signal([{ id: 'dept-1', name: 'Finance' }]).asReadonly(),
      payrollRuns: signal([{ id: 'run-1', month: 2, year: 2026, label: 'February 2026', employeeCount: 1, totalNetPay: 1 }]).asReadonly(),
      payrollRecords: signal([]).asReadonly(),
      payrollSummary: signal({ employeeCount: 0, totalGross: 0, totalDeductions: 0, totalNet: 0 }).asReadonly(),
      payrollRunInfo: signal(null).asReadonly(),
      payrollLoading: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      loadFilterOptions: vi.fn(async () => {}),
      loadPayroll: vi.fn(async () => {})
    };
    csvMock = { exportRows: vi.fn(() => {}) };

    await TestBed.configureTestingModule({
      imports: [ReportsPayrollRebuildComponent],
      providers: [
        provideRouter([]),
        { provide: ReportsRebuildStore, useValue: storeMock },
        { provide: ReportsCsvExportService, useValue: csvMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsPayrollRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads filters and initial payroll report', () => {
    expect(storeMock.loadFilterOptions).toHaveBeenCalledTimes(1);
    expect(storeMock.loadPayroll).toHaveBeenCalledTimes(1);
  });

  it('forwards export action to csv service', () => {
    component.exportCsv();
    expect(csvMock.exportRows).toHaveBeenCalledTimes(1);
  });
});
