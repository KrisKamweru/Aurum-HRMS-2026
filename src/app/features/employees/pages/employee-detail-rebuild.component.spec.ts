import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { RebuildEmployeeRecord } from '../data/employees-rebuild.models';
import { EmployeesRebuildStore } from '../data/employees-rebuild.store';
import { EmployeeDetailRebuildComponent } from './employee-detail-rebuild.component';

describe('EmployeeDetailRebuildComponent', () => {
  let fixture: ComponentFixture<EmployeeDetailRebuildComponent>;
  let component: EmployeeDetailRebuildComponent;
  let paramMapSubject: Subject<ReturnType<typeof convertToParamMap>>;
  let loadEmployeeDetail: ReturnType<typeof vi.fn>;
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    paramMapSubject = new Subject<ReturnType<typeof convertToParamMap>>();
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

    loadEmployeeDetail = vi.fn(async () => {});
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
          provide: EmployeesRebuildStore,
          useValue: {
            selectedEmployee: employeeState.asReadonly(),
            detailCollections: detailCollections.asReadonly(),
            detailLoading: detailLoading.asReadonly(),
            error: error.asReadonly(),
            loadEmployeeDetail
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
});
