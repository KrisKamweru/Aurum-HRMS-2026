import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicFormComponent } from './dynamic-form.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../services/form-helper.service';

describe('DynamicFormComponent', () => {
  let fixture: ComponentFixture<DynamicFormComponent>;
  let component: DynamicFormComponent;

  const fields: FieldConfig[] = [
    { name: 'firstName', label: 'First Name', type: 'text', required: true, sectionId: 'identity', colSpan: 2 },
    { name: 'email', label: 'Email', type: 'email', required: true, sectionId: 'contact' },
  ];

  const sections: FormSectionConfig[] = [
    { id: 'identity', columns: { base: 1, md: 2, lg: 3 } },
    { id: 'contact', columns: { base: 1, md: 2, lg: 2 } },
  ];

  const steps: FormStepConfig[] = [
    { id: 'step-1', title: 'Identity', sectionIds: ['identity'] },
    { id: 'step-2', title: 'Contact', sectionIds: ['contact'] },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('fields', fields);
    fixture.componentRef.setInput('sections', sections);
    fixture.componentRef.setInput('steps', steps);
    fixture.detectChanges();
  });

  it('maps section grid and field span classes for responsive layout', () => {
    const identitySection = component.resolvedSections().find((section) => section.id === 'identity');
    expect(identitySection).toBeTruthy();
    expect(component.getGridClass(identitySection!)).toContain('md:grid-cols-2');
    expect(component.getGridClass(identitySection!)).toContain('lg:grid-cols-3');
    expect(component.getFieldClass(fields[0])).toContain('md:col-span-2');
  });

  it('blocks step advance when current step fields are invalid', () => {
    expect(component.activeStepIndex()).toBe(0);
    expect(component.canAdvanceCurrentStep()).toBe(false);

    component.goNextStep();

    expect(component.activeStepIndex()).toBe(0);
    expect(component.form.get('firstName')?.touched).toBe(true);
  });

  it('emits full multi-step payload when valid on final step', () => {
    let emittedValue: any = null;
    component.formSubmit.subscribe((value) => {
      emittedValue = value;
    });

    component.form.patchValue({ firstName: 'Aurum' });
    component.goNextStep();
    expect(component.activeStepIndex()).toBe(1);

    component.form.patchValue({ email: 'aurum@example.com' });
    component.onSubmit();

    expect(emittedValue).toEqual({
      firstName: 'Aurum',
      email: 'aurum@example.com',
    });
  });
});
