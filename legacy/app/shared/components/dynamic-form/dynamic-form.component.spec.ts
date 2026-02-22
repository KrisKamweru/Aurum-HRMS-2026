import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicFormComponent } from './dynamic-form.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../services/form-helper.service';

describe('DynamicFormComponent', () => {
  let fixture: ComponentFixture<DynamicFormComponent>;
  let component: DynamicFormComponent;

  const fields: FieldConfig[] = [
    { name: 'firstName', label: 'First Name', type: 'text', required: true, sectionId: 'profile' },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true, sectionId: 'profile' },
    { name: 'email', label: 'Email', type: 'email', required: true, sectionId: 'contact' }
  ];

  const sections: FormSectionConfig[] = [
    { id: 'profile', title: 'Profile', columns: { base: 1, md: 2, lg: 2 } },
    { id: 'contact', title: 'Contact', columns: { base: 1, md: 2, lg: 2 } }
  ];

  const steps: FormStepConfig[] = [
    { id: 'step-1', title: 'Profile', sectionIds: ['profile'] },
    { id: 'step-2', title: 'Contact', sectionIds: ['contact'] }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('fields', fields);
    fixture.componentRef.setInput('sections', sections);
    fixture.componentRef.setInput('steps', steps);
    fixture.componentRef.setInput('container', 'modal');
    fixture.componentRef.setInput('initialValues', { firstName: 'Amina' });
    fixture.detectChanges();
  });

  it('builds form and patches initial values', () => {
    expect(component.form.get('firstName')?.value).toBe('Amina');
    expect(component.form.get('email')).toBeTruthy();
  });

  it('shows only the active step fields', () => {
    expect(component.visibleSections().map((s) => s.id)).toEqual(['profile']);
    component.form.patchValue({ firstName: 'Amina', lastName: 'Hassan' });
    component.goNextStep();
    fixture.detectChanges();
    expect(component.visibleSections().map((s) => s.id)).toEqual(['contact']);
  });

  it('resolves multi-column classes', () => {
    const className = component.getGridClass(component.visibleSections()[0]);
    expect(className).toContain('md:grid-cols-2');
    expect(className).toContain('lg:grid-cols-2');
  });
});
