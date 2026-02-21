import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { OrganizationListShellComponent } from '../components/organization-list-shell.component';
import { OrganizationPageStateComponent } from '../components/organization-page-state.component';
import { OrganizationTableMetadataComponent } from '../components/organization-table-metadata.component';
import { RebuildDepartment, RebuildEmployeeLookup } from '../data/organization-rebuild.models';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';
import { DepartmentsRebuildComponent } from './departments-rebuild.component';

describe('DepartmentsRebuildComponent', () => {
  let fixture: ComponentFixture<DepartmentsRebuildComponent>;
  let component: DepartmentsRebuildComponent;
  let departments: ReturnType<typeof signal<RebuildDepartment[]>>;
  let managerLookup: ReturnType<typeof signal<RebuildEmployeeLookup[]>>;
  let storeMock: Pick<
    OrganizationRebuildStore,
    | 'departments'
    | 'managerLookup'
    | 'departmentsLoading'
    | 'isSaving'
    | 'error'
    | 'loadDepartments'
    | 'addDepartment'
    | 'updateDepartment'
    | 'removeDepartment'
    | 'clearError'
  >;

  beforeEach(async () => {
    departments = signal<RebuildDepartment[]>([
      { id: 'dept-hr', name: 'Human Resources', code: 'HR', description: 'People ops', managerId: 'emp-a', managerName: 'Amina Hassan', managerStatus: 'active', headcount: 4 },
      { id: 'dept-eng', name: 'Engineering', code: 'ENG', description: 'Product build', managerId: 'emp-b', managerName: 'James Doe', managerStatus: 'active', headcount: 8 }
    ]);
    managerLookup = signal<RebuildEmployeeLookup[]>([
      { id: 'emp-a', firstName: 'Amina', lastName: 'Hassan', email: 'amina.hassan@aurum.dev', status: 'active' },
      { id: 'emp-b', firstName: 'James', lastName: 'Doe', email: 'james.doe@aurum.dev', status: 'active' },
      { id: 'emp-c', firstName: 'Leah', lastName: 'Mutiso', email: 'leah.mutiso@aurum.dev', status: 'inactive' }
    ]);
    const loading = signal(false);
    const saving = signal(false);
    const error = signal<string | null>(null);

    storeMock = {
      departments: departments.asReadonly(),
      managerLookup: managerLookup.asReadonly(),
      departmentsLoading: loading.asReadonly(),
      isSaving: saving.asReadonly(),
      error: error.asReadonly(),
      loadDepartments: vi.fn(async () => {}),
      addDepartment: vi.fn(async (payload) => {
        departments.update((rows) => [
          ...rows,
          {
            id: `dept-${rows.length + 1}`,
            name: payload.name,
            code: payload.code ?? 'NEW',
            description: payload.description ?? '',
            managerId: payload.managerId,
            managerName: payload.managerId === 'emp-a' ? 'Amina Hassan' : payload.managerId === 'emp-b' ? 'James Doe' : payload.managerId === 'emp-c' ? 'Leah Mutiso' : undefined,
            managerStatus: payload.managerId === 'emp-c' ? 'inactive' : 'active',
            headcount: 0
          }
        ]);
        return true;
      }),
      updateDepartment: vi.fn(async (payload) => {
        departments.update((rows) =>
          rows.map((row) => (row.id === payload.id ? { ...row, name: payload.name, code: payload.code ?? row.code } : row))
        );
        return true;
      }),
      removeDepartment: vi.fn(async (id) => {
        departments.update((rows) => rows.filter((row) => row.id !== id));
        return true;
      }),
      clearError: vi.fn(() => {})
    };

    await TestBed.configureTestingModule({
      imports: [DepartmentsRebuildComponent],
      providers: [{ provide: OrganizationRebuildStore, useValue: storeMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(DepartmentsRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads departments on init', () => {
    expect(storeMock.loadDepartments).toHaveBeenCalledTimes(1);
  });

  it('starts with provided departments', () => {
    expect(component.departments().length).toBe(2);
    expect(component.departments().map((d) => d.name)).toEqual(['Human Resources', 'Engineering']);
  });

  it('adds a new department from modal form', async () => {
    component.openCreateModal();
    await component.createDepartmentFromForm({
      name: 'Finance',
      managerId: 'emp-a'
    });

    expect(storeMock.addDepartment).toHaveBeenCalledTimes(1);
    expect(storeMock.addDepartment).toHaveBeenCalledWith({
      name: 'Finance',
      code: '',
      managerId: 'emp-a',
      description: ''
    });
    expect(component.departments().some((d) => d.name === 'Finance')).toBe(true);
    expect(component.isCreateModalOpen()).toBe(false);
  });

  it('maps manager lookup into form select options', () => {
    const managerField = component.departmentFields.find((field) => field.name === 'managerId');
    expect(managerField?.options?.length).toBe(2);
    expect(managerField?.options?.[0]?.label).toContain('Amina Hassan');
  });

  it('maps stale or inactive manager labels for display fallback', () => {
    expect(component.managerLabel(component.departments()[0])).toBe('Amina Hassan');
    expect(
      component.managerLabel({
        id: 'dept-stale',
        name: 'Stale',
        code: 'STL',
        description: '',
        managerId: 'emp-z',
        headcount: 0
      })
    ).toBe('Unavailable manager');
    expect(
      component.managerLabel({
        id: 'dept-inactive',
        name: 'Legacy',
        code: 'LGC',
        description: '',
        managerId: 'emp-c',
        managerName: 'Leah Mutiso',
        managerStatus: 'inactive',
        headcount: 0
      })
    ).toContain('inactive');
  });

  it('renders shared table action controls for each department row', () => {
    const host = fixture.nativeElement as HTMLElement;
    const actionCells = host.querySelectorAll('app-organization-table-actions');
    expect(actionCells.length).toBe(component.departments().length);
  });

  it('renders shared organization list shell with configured heading copy', () => {
    const shell = fixture.debugElement.query(By.directive(OrganizationListShellComponent));
    expect(shell).not.toBeNull();

    const shellComponent = shell.componentInstance as OrganizationListShellComponent;
    expect(shellComponent.title).toBe('Departments');
  });

  it('retries department loading when page-state retry is requested', () => {
    const state = fixture.debugElement.query(By.directive(OrganizationPageStateComponent)).componentInstance as OrganizationPageStateComponent;

    state.retryRequested.emit();

    expect(storeMock.loadDepartments).toHaveBeenCalledTimes(2);
  });

  it('wires empty-state primary and secondary actions to create and refresh', () => {
    departments.set([]);
    fixture.detectChanges();
    const state = fixture.debugElement.query(By.directive(OrganizationPageStateComponent)).componentInstance as OrganizationPageStateComponent;

    expect(state.showEmptyActions).toBe(true);
    expect(state.emptyPrimaryLabel).toBe('Add Department');

    state.emptyPrimaryRequested.emit();
    expect(component.isCreateModalOpen()).toBe(true);

    state.emptySecondaryRequested.emit();
    expect(storeMock.loadDepartments).toHaveBeenCalledTimes(2);
  });

  it('uses table loading skeleton variant', () => {
    const state = fixture.debugElement.query(By.directive(OrganizationPageStateComponent)).componentInstance as OrganizationPageStateComponent;
    expect(state.loadingVariant).toBe('table');
  });

  it('renders shared table metadata with count and refresh timestamp', () => {
    const metadata = fixture.debugElement.query(By.directive(OrganizationTableMetadataComponent));
    expect(metadata).not.toBeNull();

    const metadataComponent = metadata.componentInstance as OrganizationTableMetadataComponent;
    expect(metadataComponent.itemLabel).toBe('Departments');
    expect(metadataComponent.count).toBe(component.departments().length);
    expect(metadataComponent.lastRefreshedAt).not.toBeNull();
  });

  it('removes an existing department after confirmation', async () => {
    const target = component.departments()[0];
    component.requestDepartmentRemoval(target.id);
    await component.confirmDepartmentRemoval();

    expect(storeMock.removeDepartment).toHaveBeenCalledWith(target.id);
    expect(component.departments().some((d) => d.id === target.id)).toBe(false);
  });

  it('opens and closes create modal', () => {
    expect(component.isCreateModalOpen()).toBe(false);
    component.openCreateModal();
    expect(component.isCreateModalOpen()).toBe(true);
    component.closeCreateModal();
    expect(component.isCreateModalOpen()).toBe(false);
  });
});
