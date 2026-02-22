import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { SessionUser } from '../../../core/auth/auth.types';
import { RebuildEmployeeRecord } from '../data/employees-rebuild.models';
import { EmployeesRebuildStore } from '../data/employees-rebuild.store';
import { EmployeeDetailRebuildComponent } from './employee-detail-rebuild.component';

describe('EmployeeDetailRebuildComponent', () => {
  let fixture: ComponentFixture<EmployeeDetailRebuildComponent>;
  let component: EmployeeDetailRebuildComponent;
  let paramMapSubject: Subject<ReturnType<typeof convertToParamMap>>;
  let loadEmployeeDetail: ReturnType<typeof vi.fn>;
  let submitCompensationChange: ReturnType<typeof vi.fn>;
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let user: WritableSignal<SessionUser | null>;

  beforeEach(async () => {
    paramMapSubject = new Subject<ReturnType<typeof convertToParamMap>>();
    user = signal({ id: 'user-1', name: 'Admin User', role: 'admin', email: 'admin@aurum.dev' });
    const employeeState = signal<RebuildEmployeeRecord | null>({
      id: 'emp-1',
      firstName: 'Amina',
      lastName: 'Hassan',
      fullName: 'Amina Hassan',
      email: 'amina@aurum.dev',
      status: 'active',
      startDate: '2025-01-01',
      baseSalary: 120000,
      currency: 'USD',
      payFrequency: 'monthly'
    });
    const detailCollections = signal({
      emergencyContacts: 2,
      bankingRecords: 1,
      educationRecords: 0,
      documents: 3,
      hasStatutoryInfo: true
    });
    const detailLoading = signal(false);
    const error = signal<string | null>(null);
    const isSaving = signal(false);

    loadEmployeeDetail = vi.fn(async () => {});
    submitCompensationChange = vi.fn(async () => ({ mode: 'pending' as const, changeRequestId: 'cr-1' }));
    routerMock = {
      navigate: vi.fn(async () => true)
    };

    await TestBed.configureTestingModule({
      imports: [EmployeeDetailRebuildComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject.asObservable()
          }
        },
        { provide: Router, useValue: routerMock },
        {
          provide: AuthSessionService,
          useValue: {
            user: user.asReadonly()
          }
        },
        {
          provide: EmployeesRebuildStore,
          useValue: {
            selectedEmployee: employeeState.asReadonly(),
            detailCollections: detailCollections.asReadonly(),
            detailLoading: detailLoading.asReadonly(),
            isSaving: isSaving.asReadonly(),
            error: error.asReadonly(),
            loadEmployeeDetail,
            submitCompensationChange
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeDetailRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads employee detail when route id is present', () => {
    paramMapSubject.next(convertToParamMap({ id: 'emp-1' }));

    expect(loadEmployeeDetail).toHaveBeenCalledWith('emp-1');
    expect(component.routeError()).toBeNull();
  });

  it('sets route error when id parameter is missing', () => {
    paramMapSubject.next(convertToParamMap({}));

    expect(component.routeError()).toBe('Employee route is missing an id parameter.');
    expect(loadEmployeeDetail).not.toHaveBeenCalled();
  });

  it('retries loading current employee from stored route id', () => {
    paramMapSubject.next(convertToParamMap({ id: 'emp-1' }));
    loadEmployeeDetail.mockClear();

    component.reloadCurrentEmployee();

    expect(loadEmployeeDetail).toHaveBeenCalledWith('emp-1');
  });

  it('navigates back to employees list', () => {
    component.goToList();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/employees']);
  });

  it('formats salary and pay frequency values', () => {
    expect(component.formattedSalary()).toContain('$120,000.00');
    expect(component.formattedPayFrequency()).toBe('Monthly');
  });

  it('maps status to badge variants', () => {
    expect(component.statusVariant('active')).toBe('success');
    expect(component.statusVariant('on-leave')).toBe('warning');
    expect(component.statusVariant('resigned')).toBe('danger');
    expect(component.statusVariant('unknown')).toBe('neutral');
  });

  it('supports compensation edit submit flow for admin users', async () => {
    paramMapSubject.next(convertToParamMap({ id: 'emp-1' }));
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    host.querySelectorAll('button').forEach((button) => {
      if (button.textContent?.trim() === 'Compensation') {
        button.click();
      }
    });
    fixture.detectChanges();

    const editButton = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Edit');
    expect(editButton).toBeTruthy();
    editButton?.click();
    fixture.detectChanges();

    const salaryInput = host.querySelector('input[formcontrolname="baseSalary"]') as HTMLInputElement | null;
    expect(salaryInput).not.toBeNull();
    if (!salaryInput) {
      return;
    }
    salaryInput.value = '91000';
    salaryInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saveButton = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Save Changes');
    expect(saveButton).toBeTruthy();
    saveButton?.click();
    fixture.detectChanges();

    const reasonInput = host.querySelector('#confirm-reason') as HTMLTextAreaElement | null;
    expect(reasonInput).not.toBeNull();
    if (!reasonInput) {
      return;
    }
    reasonInput.value = 'Quarterly compensation review adjustment';
    reasonInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const submitButton = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Submit');
    expect(submitButton).toBeTruthy();
    submitButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(submitCompensationChange).toHaveBeenCalledWith({
      employeeId: 'emp-1',
      baseSalary: 91000,
      currency: 'USD',
      payFrequency: 'monthly',
      reason: 'Quarterly compensation review adjustment'
    });
    expect(Array.from(host.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Save Changes')).toBe(false);
  });

  it('hides compensation edit actions for managers and renders read-only financial tiles', () => {
    user.set({ id: 'user-2', name: 'Manager User', role: 'manager', email: 'manager@aurum.dev' });
    paramMapSubject.next(convertToParamMap({ id: 'emp-1' }));
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    host.querySelectorAll('button').forEach((button) => {
      if (button.textContent?.trim() === 'Compensation') {
        button.click();
      }
    });
    fixture.detectChanges();

    expect(Array.from(host.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Edit')).toBe(false);

    host.querySelectorAll('button').forEach((button) => {
      if (button.textContent?.trim() === 'Financial') {
        button.click();
      }
    });
    fixture.detectChanges();

    const tileText = host.textContent ?? '';
    expect(tileText).toContain('Allowances');
    expect(tileText).toContain('Deductions');
    expect(Array.from(host.querySelectorAll('button')).filter((button) => button.textContent?.trim() === 'Add')).toHaveLength(0);
  });
});
