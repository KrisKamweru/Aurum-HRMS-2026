import { FormControl, Validators } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiFormFieldComponent } from './ui-form-field.component';

describe('UiFormFieldComponent', () => {
  let fixture: ComponentFixture<UiFormFieldComponent>;
  let component: UiFormFieldComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiFormFieldComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiFormFieldComponent);
    component = fixture.componentInstance;
    component.label = 'Email';
    fixture.detectChanges();
  });

  it('renders label text', () => {
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Email');
  });

  it('returns required validation message', () => {
    const control = new FormControl('', { validators: [Validators.required] });
    control.markAsTouched();
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();

    expect(component.errorMessage()).toContain('required');
  });
});
