import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { PayrollRebuildStore } from '../data/payroll-rebuild.store';
import { PayslipViewRebuildComponent } from './payslip-view-rebuild.component';

describe('PayslipViewRebuildComponent', () => {
  let fixture: ComponentFixture<PayslipViewRebuildComponent>;
  let component: PayslipViewRebuildComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let storeMock: Pick<
    PayrollRebuildStore,
    'selectedPayslip' | 'isPayslipLoading' | 'error' | 'loadPayslip'
  >;

  beforeEach(async () => {
    navigate = vi.fn(async () => true);
    paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'slip-1' }));

    storeMock = {
      selectedPayslip: signal({
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
        generatedAt: '2026-02-25T10:00:00.000Z',
        month: 2,
        year: 2026
      }).asReadonly(),
      isPayslipLoading: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      loadPayslip: vi.fn(async () => 'loaded')
    };

    await TestBed.configureTestingModule({
      imports: [PayslipViewRebuildComponent],
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

    fixture = TestBed.createComponent(PayslipViewRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads payslip on route init', () => {
    expect(storeMock.loadPayslip).toHaveBeenCalledWith('slip-1');
  });

  it('navigates to payroll run on back when run context exists', () => {
    component.goBack();

    expect(navigate).toHaveBeenCalledWith(['/payroll', 'run-1']);
  });

  it('redirects unauthorized loads to dashboard', async () => {
    storeMock.loadPayslip = vi.fn(async () => 'unauthorized');

    paramMap$.next(convertToParamMap({ id: 'slip-77' }));
    await fixture.whenStable();

    expect(storeMock.loadPayslip).toHaveBeenCalledWith('slip-77');
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('computes initials and employer contribution totals', () => {
    expect(component.getInitials('Amina Hassan')).toBe('AH');
    expect(component.totalEmployerContributions()).toBe(6000);
  });
});
