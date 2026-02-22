import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { api } from '../../../../../convex/_generated/api';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { EmployeesRebuildDataService } from './employees-rebuild.data.service';

describe('EmployeesRebuildDataService', () => {
  let service: EmployeesRebuildDataService;
  let query: ReturnType<typeof vi.fn>;
  let mutation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn(async () => []);
    mutation = vi.fn(async () => undefined);

    TestBed.configureTestingModule({
      providers: [
        EmployeesRebuildDataService,
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

    service = TestBed.inject(EmployeesRebuildDataService);
  });

  it('maps employee list rows and filters invalid records', async () => {
    query.mockResolvedValueOnce([
      {
        _id: 'emp-1',
        firstName: 'Amina',
        lastName: 'Hassan',
        email: 'amina@aurum.dev',
        status: 'active',
        department: 'Finance',
        position: 'Analyst'
      },
      { _id: 'bad-record' }
    ]);

    const rows = await service.listEmployees();

    expect(rows.length).toBe(1);
    expect(rows[0]?.id).toBe('emp-1');
    expect(rows[0]?.fullName).toBe('Amina Hassan');
    expect(rows[0]?.department).toBe('Finance');
  });

  it('loads a single employee profile', async () => {
    query.mockResolvedValueOnce({
      _id: 'emp-1',
      firstName: 'Amina',
      lastName: 'Hassan',
      email: 'amina@aurum.dev',
      status: 'active'
    });

    const row = await service.getEmployee('emp-1');

    expect(row?.id).toBe('emp-1');
    expect(query).toHaveBeenCalledWith(api.employees.get, { id: 'emp-1' });
  });

  it('returns null when employee profile shape is invalid', async () => {
    query.mockImplementationOnce(async () => ({ _id: 'emp-1' }));

    const row = await service.getEmployee('emp-1');

    expect(row).toBeNull();
  });

  it('maps department, designation and location references', async () => {
    query.mockResolvedValueOnce([{ _id: 'dept-1', name: 'Finance', code: 'FIN' }]);
    query.mockResolvedValueOnce([{ _id: 'desig-1', title: 'Analyst', code: 'ANL' }]);
    query.mockResolvedValueOnce([{ _id: 'loc-1', name: 'Nairobi HQ', city: 'Nairobi' }]);

    const [departments, designations, locations] = await Promise.all([
      service.listDepartmentReferences(),
      service.listDesignationReferences(),
      service.listLocationReferences()
    ]);

    expect(departments).toEqual([{ id: 'dept-1', label: 'Finance', meta: 'FIN' }]);
    expect(designations).toEqual([{ id: 'desig-1', label: 'Analyst', meta: 'ANL' }]);
    expect(locations).toEqual([{ id: 'loc-1', label: 'Nairobi HQ', meta: 'Nairobi' }]);
  });

  it('creates and updates employees with normalized optional ids and text', async () => {
    await service.createEmployee({
      firstName: 'Amina',
      lastName: 'Hassan',
      email: 'amina@aurum.dev',
      departmentId: 'dept-1',
      designationId: 'desig-1',
      locationId: '',
      managerId: 'emp-2',
      status: 'active',
      startDate: '2026-02-21',
      phone: ' ',
      address: ' Westlands ',
      gender: 'Female',
      dob: ''
    });

    await service.updateEmployee({
      id: 'emp-1',
      firstName: 'Amina',
      lastName: 'Hassan',
      email: 'amina@aurum.dev',
      departmentId: 'dept-1',
      designationId: 'desig-1',
      locationId: 'loc-1',
      managerId: '',
      status: 'active',
      startDate: '2026-02-21'
    });

    expect(mutation).toHaveBeenNthCalledWith(1, api.employees.create, {
      firstName: 'Amina',
      lastName: 'Hassan',
      email: 'amina@aurum.dev',
      departmentId: 'dept-1',
      designationId: 'desig-1',
      locationId: undefined,
      status: 'active',
      startDate: '2026-02-21',
      managerId: 'emp-2',
      phone: undefined,
      address: 'Westlands',
      gender: 'Female',
      dob: undefined
    });

    expect(mutation).toHaveBeenNthCalledWith(2, api.employees.update, {
      id: 'emp-1',
      firstName: 'Amina',
      lastName: 'Hassan',
      email: 'amina@aurum.dev',
      departmentId: 'dept-1',
      designationId: 'desig-1',
      locationId: 'loc-1',
      startDate: '2026-02-21',
      managerId: undefined,
      phone: undefined,
      address: undefined,
      gender: undefined,
      dob: undefined
    });
  });

  it('updates status and removes employee', async () => {
    await service.updateEmployeeStatus('emp-1', 'on-leave');
    await service.deleteEmployee('emp-1');

    expect(mutation).toHaveBeenNthCalledWith(1, api.employees.updateStatus, {
      id: 'emp-1',
      status: 'on-leave'
    });
    expect(mutation).toHaveBeenNthCalledWith(2, api.employees.remove, { id: 'emp-1' });
  });

  it('updates employee compensation and maps pending action responses', async () => {
    mutation.mockResolvedValueOnce({ success: true, mode: 'pending', changeRequestId: 'cr-1' });

    const result = await service.updateEmployeeCompensation({
      employeeId: 'emp-1',
      baseSalary: 91000,
      currency: ' usd ',
      payFrequency: 'monthly',
      reason: 'Quarterly review adjustment'
    });

    expect(mutation).toHaveBeenCalledWith(api.employees.updateCompensation, {
      employeeId: 'emp-1',
      baseSalary: 91000,
      currency: 'usd',
      payFrequency: 'monthly',
      reason: 'Quarterly review adjustment'
    });
    expect(result).toEqual({ mode: 'pending', changeRequestId: 'cr-1' });
  });

  it('loads detail collection counts from employee detail queries', async () => {
    query.mockResolvedValueOnce([{ _id: 'contact-1' }, { _id: 'contact-2' }]);
    query.mockResolvedValueOnce([{ _id: 'bank-1' }]);
    query.mockResolvedValueOnce([]);
    query.mockResolvedValueOnce({ _id: 'stat-1' });
    query.mockResolvedValueOnce([{ _id: 'doc-1' }, { _id: 'doc-2' }, { _id: 'doc-3' }]);

    const summary = await service.listEmployeeDetailCollections('emp-1');

    expect(summary).toEqual({
      emergencyContacts: 2,
      bankingRecords: 1,
      educationRecords: 0,
      documents: 3,
      hasStatutoryInfo: true
    });
  });
});
