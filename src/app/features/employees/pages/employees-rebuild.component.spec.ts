import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { RebuildEmployeeRecord, RebuildEmployeeReference } from '../data/employees-rebuild.models';
import { EmployeesRebuildStore } from '../data/employees-rebuild.store';
import { EmployeesRebuildComponent } from './employees-rebuild.component';

describe('EmployeesRebuildComponent', () => {
  let fixture: ComponentFixture<EmployeesRebuildComponent>;
  let component: EmployeesRebuildComponent;
  let employeesState: ReturnType<typeof signal<RebuildEmployeeRecord[]>>;
  let departmentRefsState: ReturnType<typeof signal<RebuildEmployeeReference[]>>;
  let designationRefsState: ReturnType<typeof signal<RebuildEmployeeReference[]>>;
  let locationRefsState: ReturnType<typeof signal<RebuildEmployeeReference[]>>;
  let managerRefsState: ReturnType<typeof signal<RebuildEmployeeReference[]>>;
  let loadingState: ReturnType<typeof signal<boolean>>;
  let savingState: ReturnType<typeof signal<boolean>>;
  let errorState: ReturnType<typeof signal<string | null>>;
  let storeMock: Pick<
    EmployeesRebuildStore,
    | 'employees'
    | 'listLoading'
    | 'isSaving'
    | 'error'
    | 'activeEmployeeCount'
    | 'inactiveEmployeeCount'
    | 'departmentReferences'
    | 'designationReferences'
    | 'locationReferences'
    | 'managerReferences'
    | 'loadEmployees'
    | 'loadReferences'
    | 'addEmployee'
    | 'updateEmployee'
    | 'removeEmployee'
    | 'clearError'
  >;
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    employeesState = signal<RebuildEmployeeRecord[]>([
      {
        id: 'emp-1',
        firstName: 'Amina',
        lastName: 'Hassan',
        fullName: 'Amina Hassan',
        email: 'amina@aurum.dev',
        status: 'active',
        startDate: '2025-01-01',
        departmentId: 'dept-1',
        department: 'Finance',
        designationId: 'desig-1',
        position: 'Analyst'
      }
    ]);
    departmentRefsState = signal<RebuildEmployeeReference[]>([{ id: 'dept-1', label: 'Finance' }]);
    designationRefsState = signal<RebuildEmployeeReference[]>([{ id: 'desig-1', label: 'Analyst' }]);
    locationRefsState = signal<RebuildEmployeeReference[]>([{ id: 'loc-1', label: 'Nairobi HQ', meta: 'Nairobi' }]);
    managerRefsState = signal<RebuildEmployeeReference[]>([{ id: 'emp-1', label: 'Amina Hassan', meta: 'amina@aurum.dev' }]);
    loadingState = signal(false);
    savingState = signal(false);
    errorState = signal<string | null>(null);

    storeMock = {
      employees: employeesState.asReadonly(),
      listLoading: loadingState.asReadonly(),
      isSaving: savingState.asReadonly(),
      error: errorState.asReadonly(),
      activeEmployeeCount: signal(1).asReadonly(),
      inactiveEmployeeCount: signal(0).asReadonly(),
      departmentReferences: departmentRefsState.asReadonly(),
      designationReferences: designationRefsState.asReadonly(),
      locationReferences: locationRefsState.asReadonly(),
      managerReferences: managerRefsState.asReadonly(),
      loadEmployees: vi.fn(async () => {}),
      loadReferences: vi.fn(async () => {}),
      addEmployee: vi.fn(async (payload) => {
        employeesState.update((rows) => [
          ...rows,
          {
            id: `emp-${rows.length + 1}`,
            firstName: payload.firstName,
            lastName: payload.lastName,
            fullName: `${payload.firstName} ${payload.lastName}`.trim(),
            email: payload.email,
            status: payload.status ?? 'active',
            startDate: payload.startDate,
            departmentId: payload.departmentId,
            designationId: payload.designationId
          }
        ]);
        return true;
      }),
      updateEmployee: vi.fn(async () => true),
      removeEmployee: vi.fn(async (id) => {
        employeesState.update((rows) => rows.filter((row) => row.id !== id));
        return true;
      }),
      clearError: vi.fn(() => {})
    };
    routerMock = {
      navigate: vi.fn(async () => true)
    };

    await TestBed.configureTestingModule({
      imports: [EmployeesRebuildComponent],
      providers: [
        { provide: EmployeesRebuildStore, useValue: storeMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeesRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads employees and references on init', () => {
    expect(storeMock.loadEmployees).toHaveBeenCalledTimes(1);
    expect(storeMock.loadReferences).toHaveBeenCalledTimes(1);
  });

  it('creates an employee from form payload and closes create modal', async () => {
    component.openCreateModal();
    await component.createEmployeeFromForm({
      firstName: 'Nia',
      lastName: 'Otieno',
      email: 'nia@aurum.dev',
      departmentId: 'dept-1',
      designationId: 'desig-1',
      startDate: '2026-02-21',
      status: 'active'
    });

    expect(storeMock.addEmployee).toHaveBeenCalledTimes(1);
    expect(component.isCreateModalOpen()).toBe(false);
    expect(component.employees().some((employee) => employee.email === 'nia@aurum.dev')).toBe(true);
  });

  it('maps edit payload and forwards update to the store', async () => {
    component.openEditModal(component.employees()[0]);
    await component.updateEmployeeFromForm({
      firstName: 'Amina',
      lastName: 'Hassan',
      email: 'amina@aurum.dev',
      departmentId: 'dept-1',
      designationId: 'desig-1',
      startDate: '2025-01-01',
      status: 'active'
    });

    expect(storeMock.updateEmployee).toHaveBeenCalledTimes(1);
    expect(component.isEditModalOpen()).toBe(false);
  });

  it('removes employee after confirmation event', async () => {
    component.requestEmployeeRemoval('emp-1');
    await component.confirmEmployeeRemoval();

    expect(storeMock.removeEmployee).toHaveBeenCalledWith('emp-1');
    expect(component.employees().length).toBe(0);
  });

  it('navigates to employee detail route', () => {
    component.viewEmployee('emp-1');

    expect(routerMock.navigate).toHaveBeenCalledWith(['/employees', 'emp-1']);
  });

  it('reflects create prerequisites based on org references', () => {
    expect(component.canCreateEmployee()).toBe(true);
    departmentRefsState.set([]);
    fixture.detectChanges();
    expect(component.canCreateEmployee()).toBe(false);
  });

  it('maps status variants for badge rendering', () => {
    expect(component.statusVariant('active')).toBe('success');
    expect(component.statusVariant('on-leave')).toBe('warning');
    expect(component.statusVariant('terminated')).toBe('danger');
    expect(component.statusVariant('unknown')).toBe('neutral');
  });
});
