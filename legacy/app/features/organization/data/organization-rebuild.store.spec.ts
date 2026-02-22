import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { OrganizationRebuildDataService } from './organization-rebuild.data.service';
import {
  CreateDepartmentInput,
  CreateDesignationInput,
  CreateLocationInput,
  RebuildDepartment,
  RebuildEmployeeLookup,
  RebuildDesignation,
  RebuildLocation,
  RebuildUnlinkedEmployee,
  RebuildUnlinkedUser,
  UpdateDepartmentInput,
  UpdateDesignationInput,
  UpdateLocationInput
} from './organization-rebuild.models';
import { OrganizationRebuildStore } from './organization-rebuild.store';

describe('OrganizationRebuildStore', () => {
  let store: OrganizationRebuildStore;
  let departments: RebuildDepartment[];
  let designations: RebuildDesignation[];
  let locations: RebuildLocation[];
  let users: RebuildUnlinkedUser[];
  let employees: RebuildUnlinkedEmployee[];
  let employeeLookup: RebuildEmployeeLookup[];
  let dataService: {
    listDepartments: ReturnType<typeof vi.fn<() => Promise<RebuildDepartment[]>>>;
    createDepartment: ReturnType<typeof vi.fn<(input: CreateDepartmentInput) => Promise<void>>>;
    updateDepartment: ReturnType<typeof vi.fn<(input: UpdateDepartmentInput) => Promise<void>>>;
    deleteDepartment: ReturnType<typeof vi.fn<(id: string) => Promise<void>>>;
    listDesignations: ReturnType<typeof vi.fn<() => Promise<RebuildDesignation[]>>>;
    createDesignation: ReturnType<typeof vi.fn<(input: CreateDesignationInput) => Promise<void>>>;
    updateDesignation: ReturnType<typeof vi.fn<(input: UpdateDesignationInput) => Promise<void>>>;
    deleteDesignation: ReturnType<typeof vi.fn<(id: string) => Promise<void>>>;
    listLocations: ReturnType<typeof vi.fn<() => Promise<RebuildLocation[]>>>;
    listEmployeesForManagerLookup: ReturnType<typeof vi.fn<() => Promise<RebuildEmployeeLookup[]>>>;
    createLocation: ReturnType<typeof vi.fn<(input: CreateLocationInput) => Promise<void>>>;
    updateLocation: ReturnType<typeof vi.fn<(input: UpdateLocationInput) => Promise<void>>>;
    deleteLocation: ReturnType<typeof vi.fn<(id: string) => Promise<void>>>;
    getUnlinkedUsers: ReturnType<typeof vi.fn<() => Promise<RebuildUnlinkedUser[]>>>;
    getUnlinkedEmployees: ReturnType<typeof vi.fn<() => Promise<RebuildUnlinkedEmployee[]>>>;
    linkUserToEmployee: ReturnType<typeof vi.fn<(userId: string, employeeId: string) => Promise<void>>>;
  };

  beforeEach(() => {
    departments = [
      {
        id: 'dept-hr',
        name: 'Human Resources',
        code: 'HR',
        description: 'People ops',
        managerId: 'emp-a',
        managerName: 'Amina Hassan',
        managerStatus: 'active',
        headcount: 4
      },
      {
        id: 'dept-eng',
        name: 'Engineering',
        code: 'ENG',
        description: 'Product build',
        managerId: 'emp-b',
        managerName: 'James Doe',
        managerStatus: 'active',
        headcount: 8
      }
    ];
    designations = [
      { id: 'desig-hrg', title: 'HR Generalist', code: 'HRG', level: 2, description: 'Generalist track' },
      { id: 'desig-se', title: 'Software Engineer', code: 'SE', level: 2, description: 'Engineering IC' }
    ];
    locations = [
      { id: 'loc-nbo', name: 'Nairobi HQ', address: '1 Riverside', city: 'Nairobi', country: 'Kenya' },
      { id: 'loc-blr', name: 'Bengaluru Hub', address: '77 Tech Park', city: 'Bengaluru', country: 'India' }
    ];
    users = [
      { id: 'user-a', name: 'Amina Hassan', email: 'amina.hassan@aurum.dev', role: 'employee' },
      { id: 'user-b', name: 'James Doe', email: 'user.james@aurum.dev', role: 'employee' }
    ];
    employees = [
      { id: 'emp-a', firstName: 'Amina', lastName: 'Hassan', email: 'amina.hassan@aurum.dev', status: 'active' },
      { id: 'emp-b', firstName: 'James', lastName: 'Doe', email: 'james.doe@aurum.dev', status: 'active' }
    ];
    employeeLookup = [
      { id: 'emp-a', firstName: 'Amina', lastName: 'Hassan', email: 'amina.hassan@aurum.dev', status: 'active' },
      { id: 'emp-b', firstName: 'James', lastName: 'Doe', email: 'james.doe@aurum.dev', status: 'active' },
      { id: 'emp-c', firstName: 'Leah', lastName: 'Mutiso', email: 'leah.mutiso@aurum.dev', status: 'inactive' }
    ];
    const managerNameFor = (managerId: string | undefined): string | undefined => {
      if (!managerId) {
        return undefined;
      }
      const manager = employeeLookup.find((employee) => employee.id === managerId);
      return manager ? `${manager.firstName} ${manager.lastName}`.trim() : undefined;
    };

    dataService = {
      listDepartments: vi.fn(async () => [...departments]),
      createDepartment: vi.fn(async (input) => {
        departments = [
          ...departments,
          {
            id: `dept-${departments.length + 1}`,
            name: input.name,
            code: input.code,
            description: input.description ?? '',
            managerId: input.managerId,
            managerName: managerNameFor(input.managerId),
            managerStatus: employeeLookup.find((employee) => employee.id === input.managerId)?.status,
            headcount: 0
          }
        ];
      }),
      updateDepartment: vi.fn(async (input) => {
        departments = departments.map((row) =>
          row.id === input.id
            ? {
                ...row,
                name: input.name,
                code: input.code,
                description: input.description ?? '',
                managerId: input.managerId,
                managerName: managerNameFor(input.managerId),
                managerStatus: employeeLookup.find((employee) => employee.id === input.managerId)?.status
              }
            : row
        );
      }),
      deleteDepartment: vi.fn(async (id) => {
        departments = departments.filter((row) => row.id !== id);
      }),
      listDesignations: vi.fn(async () => [...designations]),
      createDesignation: vi.fn(async (input) => {
        designations = [
          ...designations,
          {
            id: `desig-${designations.length + 1}`,
            title: input.title,
            code: input.code,
            level: input.level ?? null,
            description: input.description ?? ''
          }
        ];
      }),
      updateDesignation: vi.fn(async (input) => {
        designations = designations.map((row) =>
          row.id === input.id
            ? { ...row, title: input.title, code: input.code, level: input.level ?? null, description: input.description ?? '' }
            : row
        );
      }),
      deleteDesignation: vi.fn(async (id) => {
        designations = designations.filter((row) => row.id !== id);
      }),
      listLocations: vi.fn(async () => [...locations]),
      listEmployeesForManagerLookup: vi.fn(async () => [...employeeLookup]),
      createLocation: vi.fn(async (input) => {
        locations = [...locations, { id: `loc-${locations.length + 1}`, ...input }];
      }),
      updateLocation: vi.fn(async (input) => {
        locations = locations.map((row) => (row.id === input.id ? { ...input } : row));
      }),
      deleteLocation: vi.fn(async (id) => {
        locations = locations.filter((row) => row.id !== id);
      }),
      getUnlinkedUsers: vi.fn(async () => [...users]),
      getUnlinkedEmployees: vi.fn(async () => [...employees]),
      linkUserToEmployee: vi.fn(async (userId) => {
        users = users.filter((user) => user.id !== userId);
      })
    };

    TestBed.configureTestingModule({
      providers: [{ provide: OrganizationRebuildDataService, useValue: dataService }]
    });
    store = TestBed.inject(OrganizationRebuildStore);
  });

  it('loads baseline datasets from the data service', async () => {
    await Promise.all([store.loadDepartments(), store.loadDesignations(), store.loadLocations()]);

    expect(store.departments().length).toBe(2);
    expect(store.managerLookup().length).toBe(3);
    expect(store.designations().length).toBe(2);
    expect(store.locations().length).toBe(2);
    expect(dataService.listDepartments).toHaveBeenCalledTimes(1);
    expect(dataService.listEmployeesForManagerLookup).toHaveBeenCalledTimes(1);
    expect(dataService.listDesignations).toHaveBeenCalledTimes(1);
    expect(dataService.listLocations).toHaveBeenCalledTimes(1);
  });

  it('adds unique departments and blocks duplicates', async () => {
    await store.loadDepartments();

    expect(await store.addDepartment({ name: 'Finance', managerId: 'emp-a' })).toBe(true);
    expect(await store.addDepartment({ name: 'finance' })).toBe(false);
    expect(store.departments().some((row) => row.name === 'Finance')).toBe(true);
    expect(dataService.createDepartment).toHaveBeenCalledWith({
      name: 'Finance',
      code: 'FINANCE',
      description: undefined,
      managerId: 'emp-a'
    });
    expect(store.error()).toBe('Department names must be unique.');
  });

  it('blocks department manager selection when selected manager is inactive', async () => {
    await store.loadDepartments();

    const result = await store.addDepartment({
      name: 'Operations',
      managerId: 'emp-c'
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Selected manager must be active.');
    expect(dataService.createDepartment).not.toHaveBeenCalled();
  });

  it('blocks department manager selection when manager id is stale', async () => {
    await store.loadDepartments();

    const result = await store.updateDepartment({
      id: 'dept-hr',
      name: 'Human Resources',
      managerId: 'emp-missing'
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Selected manager is no longer available. Refresh and try again.');
    expect(dataService.updateDepartment).not.toHaveBeenCalled();
  });

  it('updates and removes departments by id', async () => {
    await store.loadDepartments();

    const first = store.departments()[0];
    const updateResult = await store.updateDepartment({
      id: first.id,
      name: 'People Operations',
      code: 'PEOPLE',
      description: 'Updated',
      managerId: 'emp-b'
    });
    expect(updateResult).toBe(true);
    expect(store.departments().some((row) => row.name === 'People Operations')).toBe(true);
    expect(store.departments().find((row) => row.id === first.id)?.managerId).toBe('emp-b');

    const target = store.departments()[0];
    expect(await store.removeDepartment(target.id)).toBe(true);
    expect(store.departments().some((row) => row.id === target.id)).toBe(false);
  });

  it('adds unique designations and blocks duplicates', async () => {
    await store.loadDesignations();

    expect(await store.addDesignation({ title: 'QA Engineer', level: 2 })).toBe(true);
    expect(await store.addDesignation({ title: 'qa engineer', level: 4 })).toBe(false);
    expect(store.designations().some((row) => row.title === 'QA Engineer')).toBe(true);
  });

  it('updates and removes designations by id', async () => {
    await store.loadDesignations();

    const first = store.designations()[0];
    const updateResult = await store.updateDesignation({
      id: first.id,
      title: 'HR Specialist',
      code: 'HRS',
      level: 3,
      description: 'Updated'
    });
    expect(updateResult).toBe(true);
    expect(store.designations().some((row) => row.title === 'HR Specialist')).toBe(true);

    const target = store.designations()[0];
    expect(await store.removeDesignation(target.id)).toBe(true);
    expect(store.designations().some((row) => row.id === target.id)).toBe(false);
  });

  it('adds unique locations and blocks duplicates by name+city', async () => {
    await store.loadLocations();

    expect(
      await store.addLocation({ name: 'Innovation Hub', address: '100 Congress Ave', city: 'Austin', country: 'USA' })
    ).toBe(true);
    expect(
      await store.addLocation({ name: 'Innovation Hub', address: '200 Congress Ave', city: 'Austin', country: 'USA' })
    ).toBe(false);
    expect(store.locations().some((row) => row.name === 'Innovation Hub' && row.city === 'Austin')).toBe(true);
  });

  it('updates and removes locations by id', async () => {
    await store.loadLocations();

    const first = store.locations()[0];
    const updateResult = await store.updateLocation({
      id: first.id,
      name: 'Nairobi HQ',
      address: '2 Riverside',
      city: 'Nairobi',
      country: 'Kenya'
    });
    expect(updateResult).toBe(true);
    expect(store.locations().find((row) => row.id === first.id)?.address).toBe('2 Riverside');

    const target = store.locations()[0];
    expect(await store.removeLocation(target.id)).toBe(true);
    expect(store.locations().some((row) => row.id === target.id)).toBe(false);
  });

  it('loads user-linking data with suggested employee matches', async () => {
    await store.loadUserLinkingData();

    expect(store.pendingUserLinks().length).toBe(2);
    expect(store.unlinkedEmployees().length).toBe(2);
    expect(store.selectedEmployeeForUser('user-a')).toBe('emp-a');
    expect(store.selectedEmployeeForUser('user-b')).toBe('emp-b');
  });

  it('links a selected user/employee pair and increments linked count', async () => {
    await store.loadUserLinkingData();
    store.setSelectedEmployeeForUser('user-b', 'emp-b');

    expect(await store.linkUserToEmployee('user-b')).toBe(true);
    expect(store.linkedCount()).toBe(1);
    expect(store.pendingUserLinks().some((row) => row.id === 'user-b')).toBe(false);
    expect(dataService.linkUserToEmployee).toHaveBeenCalledWith('user-b', 'emp-b');
  });

  it('captures and exposes service errors', async () => {
    dataService.listDepartments.mockRejectedValueOnce(new Error('Convex unavailable'));

    await store.loadDepartments();

    expect(store.error()).toBe('Convex unavailable');
  });
});
