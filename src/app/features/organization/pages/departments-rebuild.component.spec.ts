import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DepartmentsRebuildComponent } from './departments-rebuild.component';

describe('DepartmentsRebuildComponent', () => {
  let fixture: ComponentFixture<DepartmentsRebuildComponent>;
  let component: DepartmentsRebuildComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentsRebuildComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DepartmentsRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts with seed departments', () => {
    expect(component.departments().length).toBe(2);
    expect(component.departments().map((d) => d.name)).toEqual(['Human Resources', 'Engineering']);
  });

  it('adds a new department', () => {
    component.createDepartmentFromForm({
      name: 'Finance'
    });

    expect(component.departments().some((d) => d.name === 'Finance')).toBe(true);
  });

  it('removes an existing department', () => {
    const target = component.departments()[0];
    component.removeDepartment(target.id);

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
