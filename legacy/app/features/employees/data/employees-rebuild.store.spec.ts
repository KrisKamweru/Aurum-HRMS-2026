import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { EmployeesRebuildDataService } from './employees-rebuild.data.service';
import { EmployeesRebuildStore } from './employees-rebuild.store';
import { CreateEmployeeInput, RebuildEmployeeRecord, UpdateEmployeeInput } from './employees-rebuild.models';

describe('EmployeesRebuildStore', () => {
  let store: EmployeesRebuildStore;
  let employees: RebuildEmployeeRecord[];
  let dataService: {
    listEmployees: ReturnType<typeof vi.fn>;
    listDepartmentReferences: ReturnType<typeof vi.fn>;
    listDesignationReferences: ReturnType<typeof vi.fn>;
    listLocationReferences: ReturnType<typeof vi.fn>;
    listManagerReferences: ReturnType<typeof vi.fn>;
    getEmployee: ReturnType<typeof vi.fn>;
    listEmployeeDetailCollections: ReturnType<typeof vi.fn>;
    createEmployee: ReturnType<typeof vi.fn>;
    updateEmployee: ReturnType<typeof vi.fn>;
    updateEmployeeStatus: ReturnType<typeof vi.fn>;
    deleteEmployee: ReturnType<typeof vi.fn>;
    updateEmployeeCompensation: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    employees = [
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
      },
      {
        id: 'emp-2',
        firstName: 'James',
        lastName: 'Doe',
        fullName: 'James Doe',
        email: 'james@aurum.dev',
        status: 'on-leave',
        startDate: '2025-04-01',
        departmentId: 'dept-1',
        department: 'Finance',
        designationId: 'desig-2',
        position: 'Manager'
      }
    ];

    const departmentRefs = [{ id: 'dept-1', label: 'Finance', meta: 'FIN' }];
    const designationRefs = [
      { id: 'desig-1', label: 'Analyst', meta: 'ANL' },
      { id: 'desig-2', label: 'Manager', meta: 'MGR' }
    ];
    const locationRefs = [{ id: 'loc-1', label: 'Nairobi HQ', meta: 'Nairobi' }];
    const managerRefs = [{ id: 'emp-1', label: 'Amina Hassan', meta: 'amina@aurum.dev' }];

    dataService = {
      listEmployees: vi.fn(async () => [...employees]),
      listDepartmentReferences: vi.fn(async () => [...departmentRefs]),
      listDesignationReferences: vi.fn(async () => [...designationRefs]),
      listLocationReferences: vi.fn(async () => [...locationRefs]),
      listManagerReferences: vi.fn(async () => [...managerRefs]),
      getEmployee: vi.fn(async (id: string) => employees.find((employee) => employee.id === id) ?? null),
      listEmployeeDetailCollections: vi.fn(async () => ({
        emergencyContacts: 2,
        bankingRecords: 1,
        educationRecords: 0,
        documents: 3,
        hasStatutoryInfo: true
      })),
      createEmployee: vi.fn(async (input: CreateEmployeeInput) => {
        employees = [
          ...employees,
          {
            id: `emp-${employees.length + 1}`,
            firstName: input.firstName,
            lastName: input.lastName,
            fullName: `${input.firstName} ${input.lastName}`.trim(),
            email: input.email,
            status: input.status,
            startDate: input.startDate,
            departmentId: input.departmentId,
            designationId: input.designationId
          }
        ];
      }),
      updateEmployee: vi.fn(async (input: UpdateEmployeeInput) => {
        employees = employees.map((employee) =>
          employee.id === input.id
            ? {
                ...employee,
                firstName: input.firstName,
                lastName: input.lastName,
                fullName: `${input.firstName} ${input.lastName}`.trim(),
                email: input.email,
                startDate: input.startDate,
                managerId: input.managerId,
                departmentId: input.departmentId,
                designationId: input.designationId
              }
            : employee
        );
      }),
      updateEmployeeStatus: vi.fn(
        async (id: string, status: 'active' | 'on-leave' | 'terminated' | 'resigned') => {
        employees = employees.map((employee) => (employee.id === id ? { ...employee, status } : employee));
      }
      ),
      deleteEmployee: vi.fn(async (id: string) => {
        employees = employees.filter((employee) => employee.id !== id);
      }),
      updateEmployeeCompensation: vi.fn(async () => ({
        mode: 'pending' as const,
        changeRequestId: 'cr-1'
      }))
    };

    TestBed.configureTestingModule({
      providers: [{ provide: EmployeesRebuildDataService, useValue: dataService }]
    });

    store = TestBed.inject(EmployeesRebuildStore);
  });

  it('loads employees and references', async () => {
    await Promise.all([store.loadEmployees(), store.loadReferences()]);

    expect(store.employees().length).toBe(2);
    expect(store.departmentReferences().length).toBe(1);
    expect(store.designationReferences().length).toBe(2);
    expect(store.locationReferences().length).toBe(1);
    expect(store.managerReferences().length).toBe(1);
    expect(store.activeEmployeeCount()).toBe(1);
    expect(store.inactiveEmployeeCount()).toBe(1);
  });

  it('requires base employee fields before create', async () => {
    const result = await store.addEmployee({
      firstName: '',
      lastName: 'Hassan',
      email: 'new@aurum.dev',
      departmentId: 'dept-1',
      designationId: 'desig-1',
      startDate: '2026-02-21'
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('First name, last name, email, and start date are required.');
    expect(dataService.createEmployee).not.toHaveBeenCalled();
  });

  it('requires department and designation before create', async () => {
    const result = await store.addEmployee({
      firstName: 'Nia',
      lastName: 'Otieno',
      email: 'nia@aurum.dev',
      startDate: '2026-02-21'
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Department and designation are required.');
    expect(dataService.createEmployee).not.toHaveBeenCalled();
  });

  it('blocks duplicate email and stale manager assignment', async () => {
    await store.loadEmployees();
    await store.loadReferences();

    const duplicateResult = await store.addEmployee({
      firstName: 'Nia',
      lastName: 'Otieno',
      email: 'amina@aurum.dev',
      departmentId: 'dept-1',
      designationId: 'desig-1',
      startDate: '2026-02-21'
    });
    const staleManagerResult = await store.addEmployee({
      firstName: 'Nia',
      lastName: 'Otieno',
      email: 'nia@aurum.dev',
      departmentId: 'dept-1',
      designationId: 'desig-1',
      managerId: 'emp-999',
      startDate: '2026-02-21'
    });

    expect(duplicateResult).toBe(false);
    expect(staleManagerResult).toBe(false);
    expect(store.error()).toBe('Selected manager is no longer available.');
  });

  it('creates employee and normalizes status fallback', async () => {
    await store.loadEmployees();
    await store.loadReferences();

    const result = await store.addEmployee({
      firstName: 'Nia',
      lastName: 'Otieno',
      email: 'nia@aurum.dev',
      departmentId: 'dept-1',
      designationId: 'desig-1',
      status: 'unknown-status',
      startDate: '2026-02-21'
    });

    expect(result).toBe(true);
    expect(dataService.createEmployee).toHaveBeenCalledWith({
      firstName: 'Nia',
      lastName: 'Otieno',
      email: 'nia@aurum.dev',
      departmentId: 'dept-1',
      designationId: 'desig-1',
      locationId: undefined,
      managerId: undefined,
      status: 'active',
      startDate: '2026-02-21',
      phone: undefined,
      address: undefined,
      gender: undefined,
      dob: undefined
    });
    expect(store.employees().some((employee) => employee.email === 'nia@aurum.dev')).toBe(true);
  });

  it('updates employee and syncs status when changed', async () => {
    await store.loadEmployees();
    await store.loadReferences();
    await store.loadEmployeeDetail('emp-1');

    const result = await store.updateEmployee({
      id: 'emp-1',
      firstName: 'Amina',
      lastName: 'Hassan',
      email: 'amina@aurum.dev',
      departmentId: 'dept-1',
      designationId: 'desig-2',
      managerId: '',
      status: 'terminated',
      startDate: '2025-01-01'
    });

    expect(result).toBe(true);
    expect(dataService.updateEmployee).toHaveBeenCalledTimes(1);
    expect(dataService.updateEmployeeStatus).toHaveBeenCalledWith('emp-1', 'terminated');
    expect(store.selectedEmployee()?.status).toBe('terminated');
  });

  it('blocks self manager assignment during update', async () => {
    await store.loadEmployees();
    await store.loadReferences();

    const result = await store.updateEmployee({
      id: 'emp-1',
      firstName: 'Amina',
      lastName: 'Hassan',
      email: 'amina@aurum.dev',
      departmentId: 'dept-1',
      designationId: 'desig-2',
      managerId: 'emp-1',
      status: 'active',
      startDate: '2025-01-01'
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('An employee cannot be their own manager.');
    expect(dataService.updateEmployee).not.toHaveBeenCalled();
  });

  it('removes employee when found and blocks unknown ids', async () => {
    await store.loadEmployees();

    expect(await store.removeEmployee('emp-missing')).toBe(false);
    expect(store.error()).toBe('Employee not found.');

    expect(await store.removeEmployee('emp-2')).toBe(true);
    expect(store.employees().some((employee) => employee.id === 'emp-2')).toBe(false);
  });

  it('loads selected employee detail and collection summary', async () => {
    await store.loadEmployeeDetail('emp-1');

    expect(store.selectedEmployee()?.id).toBe('emp-1');
    expect(store.detailCollections()).toEqual({
      emergencyContacts: 2,
      bankingRecords: 1,
      educationRecords: 0,
      documents: 3,
      hasStatutoryInfo: true
    });
  });

  it('exposes missing employee detail as not found error', async () => {
    await store.loadEmployeeDetail('emp-missing');

    expect(store.selectedEmployee()).toBeNull();
    expect(store.error()).toBe('Employee not found.');
  });

  it('captures data service errors on load', async () => {
    dataService.listEmployees.mockRejectedValueOnce(new Error('Convex unavailable'));

    await store.loadEmployees();

    expect(store.error()).toBe('Convex unavailable');
  });

  it('submits compensation changes and reloads selected employee detail', async () => {
    await store.loadEmployeeDetail('emp-1');
    dataService.getEmployee.mockClear();
    dataService.listEmployeeDetailCollections.mockClear();

    const result = await store.submitCompensationChange({
      employeeId: 'emp-1',
      baseSalary: 91000,
      currency: 'usd',
      payFrequency: 'monthly',
      reason: 'Quarterly compensation review adjustment'
    });

    expect(result).toEqual({ mode: 'pending', changeRequestId: 'cr-1' });
    expect(dataService.updateEmployeeCompensation).toHaveBeenCalledWith({
      employeeId: 'emp-1',
      baseSalary: 91000,
      currency: 'USD',
      payFrequency: 'monthly',
      reason: 'Quarterly compensation review adjustment'
    });
    expect(dataService.getEmployee).toHaveBeenCalledWith('emp-1');
    expect(dataService.listEmployeeDetailCollections).toHaveBeenCalledWith('emp-1');
  });

  it('validates compensation submissions before calling data service', async () => {
    const missingReason = await store.submitCompensationChange({
      employeeId: 'emp-1',
      baseSalary: 91000,
      reason: '   '
    });

    expect(missingReason).toBeNull();
    expect(store.error()).toBe('A change reason is required for compensation updates.');

    const invalidAmount = await store.submitCompensationChange({
      employeeId: 'emp-1',
      baseSalary: -1,
      reason: 'Reason'
    });

    expect(invalidAmount).toBeNull();
    expect(store.error()).toBe('Base salary must be a valid non-negative number.');
    expect(dataService.updateEmployeeCompensation).not.toHaveBeenCalled();
  });
});
