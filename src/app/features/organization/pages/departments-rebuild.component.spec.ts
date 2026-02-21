import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { RebuildDepartment } from '../data/organization-rebuild.models';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';
import { DepartmentsRebuildComponent } from './departments-rebuild.component';

describe('DepartmentsRebuildComponent', () => {
  let fixture: ComponentFixture<DepartmentsRebuildComponent>;
  let component: DepartmentsRebuildComponent;
  let departments: ReturnType<typeof signal<RebuildDepartment[]>>;
  let storeMock: Pick<
    OrganizationRebuildStore,
    'departments' | 'departmentsLoading' | 'isSaving' | 'error' | 'loadDepartments' | 'addDepartment' | 'updateDepartment' | 'removeDepartment' | 'clearError'
  >;

  beforeEach(async () => {
    departments = signal<RebuildDepartment[]>([
      { id: 'dept-hr', name: 'Human Resources', code: 'HR', description: 'People ops', headcount: 4 },
      { id: 'dept-eng', name: 'Engineering', code: 'ENG', description: 'Product build', headcount: 8 }
    ]);
    const loading = signal(false);
    const saving = signal(false);
    const error = signal<string | null>(null);

    storeMock = {
      departments: departments.asReadonly(),
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
      name: 'Finance'
    });

    expect(storeMock.addDepartment).toHaveBeenCalledTimes(1);
    expect(component.departments().some((d) => d.name === 'Finance')).toBe(true);
    expect(component.isCreateModalOpen()).toBe(false);
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
