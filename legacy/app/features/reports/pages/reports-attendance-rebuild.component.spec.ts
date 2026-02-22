import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ReportsCsvExportService } from '../data/reports-csv-export.service';
import { ReportsRebuildStore } from '../data/reports-rebuild.store';
import { ReportsAttendanceRebuildComponent } from './reports-attendance-rebuild.component';

describe('ReportsAttendanceRebuildComponent', () => {
  let fixture: ComponentFixture<ReportsAttendanceRebuildComponent>;
  let component: ReportsAttendanceRebuildComponent;
  let storeMock: Pick<
    ReportsRebuildStore,
    'departments' | 'attendanceRecords' | 'attendanceSummary' | 'attendanceLoading' | 'error' | 'loadFilterOptions' | 'loadAttendance'
  >;
  let csvMock: { exportRows: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    storeMock = {
      departments: signal([{ id: 'dept-1', name: 'Finance' }]).asReadonly(),
      attendanceRecords: signal([]).asReadonly(),
      attendanceSummary: signal({ totalRecords: 0, present: 0, late: 0, absent: 0, halfDay: 0, onLeave: 0, holiday: 0 }).asReadonly(),
      attendanceLoading: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      loadFilterOptions: vi.fn(async () => {}),
      loadAttendance: vi.fn(async () => {})
    };
    csvMock = { exportRows: vi.fn(() => {}) };

    await TestBed.configureTestingModule({
      imports: [ReportsAttendanceRebuildComponent],
      providers: [
        provideRouter([]),
        { provide: ReportsRebuildStore, useValue: storeMock },
        { provide: ReportsCsvExportService, useValue: csvMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsAttendanceRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads filter options and attendance report on init', () => {
    expect(storeMock.loadFilterOptions).toHaveBeenCalledTimes(1);
    expect(storeMock.loadAttendance).toHaveBeenCalledTimes(1);
  });

  it('forwards export action to csv service', () => {
    component.exportCsv();
    expect(csvMock.exportRows).toHaveBeenCalledTimes(1);
  });
});
