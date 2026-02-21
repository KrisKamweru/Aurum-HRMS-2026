import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ReportsCsvExportService } from '../data/reports-csv-export.service';
import { ReportsRebuildStore } from '../data/reports-rebuild.store';
import { ReportsTaxRebuildComponent } from './reports-tax-rebuild.component';

describe('ReportsTaxRebuildComponent', () => {
  let fixture: ComponentFixture<ReportsTaxRebuildComponent>;
  let component: ReportsTaxRebuildComponent;
  let storeMock: Pick<
    ReportsRebuildStore,
    'payrollRuns' | 'taxRecords' | 'taxSummary' | 'taxRunInfo' | 'taxLoading' | 'error' | 'loadFilterOptions' | 'loadTax'
  >;
  let csvMock: { exportRows: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    storeMock = {
      payrollRuns: signal([{ id: 'run-1', month: 2, year: 2026, label: 'February 2026', employeeCount: 1, totalNetPay: 1 }]).asReadonly(),
      taxRecords: signal([]).asReadonly(),
      taxSummary: signal({
        employeeCount: 0,
        totalPaye: 0,
        totalNssfEmployee: 0,
        totalNssfEmployer: 0,
        totalNhif: 0,
        totalHousingLevy: 0,
        totalStatutory: 0
      }).asReadonly(),
      taxRunInfo: signal(null).asReadonly(),
      taxLoading: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      loadFilterOptions: vi.fn(async () => {}),
      loadTax: vi.fn(async () => {})
    };
    csvMock = { exportRows: vi.fn(() => {}) };

    await TestBed.configureTestingModule({
      imports: [ReportsTaxRebuildComponent],
      providers: [
        provideRouter([]),
        { provide: ReportsRebuildStore, useValue: storeMock },
        { provide: ReportsCsvExportService, useValue: csvMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsTaxRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads filters and initial tax report', () => {
    expect(storeMock.loadFilterOptions).toHaveBeenCalledTimes(1);
    expect(storeMock.loadTax).toHaveBeenCalledTimes(1);
  });

  it('forwards export action to csv service', () => {
    component.exportCsv();
    expect(csvMock.exportRows).toHaveBeenCalledTimes(1);
  });
});
