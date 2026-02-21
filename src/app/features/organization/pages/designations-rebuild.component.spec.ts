import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DesignationsRebuildComponent } from './designations-rebuild.component';

describe('DesignationsRebuildComponent', () => {
  let fixture: ComponentFixture<DesignationsRebuildComponent>;
  let component: DesignationsRebuildComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignationsRebuildComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DesignationsRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts with seeded designations', () => {
    expect(component.designations().length).toBe(2);
    expect(component.designations().map((d) => d.title)).toEqual(['HR Generalist', 'Software Engineer']);
  });

  it('adds a new designation', () => {
    component.createDesignationFromForm({
      title: 'Finance Manager',
      level: 3
    });

    expect(component.designations().some((d) => d.title === 'Finance Manager')).toBe(true);
  });

  it('removes an existing designation', () => {
    const target = component.designations()[0];
    component.removeDesignation(target.id);

    expect(component.designations().some((d) => d.id === target.id)).toBe(false);
  });

  it('opens and closes create modal', () => {
    expect(component.isCreateModalOpen()).toBe(false);
    component.openCreateModal();
    expect(component.isCreateModalOpen()).toBe(true);
    component.closeCreateModal();
    expect(component.isCreateModalOpen()).toBe(false);
  });
});
