import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { PayrollRebuildStore } from '../data/payroll-rebuild.store';
import { PayrollRunRebuildComponent } from './payroll-run-rebuild.component';

describe('PayrollRunRebuildComponent', () => {
  let fixture: ComponentFixture<PayrollRunRebuildComponent>;
  let component: PayrollRunRebuildComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let storeMock: Pick<
    PayrollRebuildStore,
    | 'selectedRun'
    | 'runSlips'
    | 'hasRunSlips'
    | 'isDetailLoading'
    | 'isActionLoading'
    | 'error'
    | 'loadRun'
    | 'processRun'
    | 'finalizeRun'
    | 'deleteRun'
    | 'clearError'
  >;

  beforeEach(async () => {
    navigate = vi.fn(async () => true);
    paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'run-1' }));

    storeMock = {
      selectedRun: signal({
        id: 'run-1',
        month: 2,
        year: 2026,
        status: 'processing',
        runDate: '2026-02-25T00:00:00.000Z',
        employeeCount: 10,
        totalGrossPay: 300000,
        totalNetPay: 250000,
        processedBy: 'user-1'
      }).asReadonly(),
      runSlips: signal([
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
          earnings: [],
          deductions: [],
          employerContributions: [],
          generatedAt: '2026-02-25T10:00:00.000Z'
        }
      ]).asReadonly(),
      hasRunSlips: signal(true).asReadonly(),
      isDetailLoading: signal(false).asReadonly(),
      isActionLoading: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      loadRun: vi.fn(async () => {}),
      processRun: vi.fn(async () => true),
      finalizeRun: vi.fn(async () => ({ mode: 'pending', changeRequestId: 'change-1' })),
      deleteRun: vi.fn(async () => ({ mode: 'applied', changeRequestId: 'change-2' })),
      clearError: vi.fn(() => {})
    };

    await TestBed.configureTestingModule({
      imports: [PayrollRunRebuildComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable()
          }
        },
        { provide: PayrollRebuildStore, useValue: storeMock },
        { provide: Router, useValue: { navigate } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PayrollRunRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads run detail on route init', () => {
    expect(storeMock.loadRun).toHaveBeenCalledWith('run-1');
  });

  it('processes payroll run through store', async () => {
    await component.processRun();

    expect(storeMock.processRun).toHaveBeenCalledWith('run-1');
  });

  it('finalizes payroll run with reason dialog', async () => {
    component.requestAction('finalize');
    expect(component.isActionDialogOpen()).toBe(true);

    await component.confirmAction('Cycle verified and ready');

    expect(storeMock.finalizeRun).toHaveBeenCalledWith('run-1', 'Cycle verified and ready');
    expect(component.isActionDialogOpen()).toBe(false);
  });

  it('deletes payroll run and navigates on applied mode', async () => {
    component.requestAction('delete');

    await component.confirmAction('Duplicate run cleanup');

    expect(storeMock.deleteRun).toHaveBeenCalledWith('run-1', 'Duplicate run cleanup');
    expect(navigate).toHaveBeenCalledWith(['/payroll']);
  });

  it('maps status variants and period labels', () => {
    expect(component.statusVariant('completed')).toBe('success');
    expect(component.statusVariant('processing')).toBe('info');
    expect(component.statusVariant('draft')).toBe('neutral');

    expect(component.periodLabel(2, 2026)).toContain('2026');
  });
});
