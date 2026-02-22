import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsDemoComponent } from './forms-demo.component';

describe('FormsDemoComponent', () => {
  let fixture: ComponentFixture<FormsDemoComponent>;
  let component: FormsDemoComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsDemoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FormsDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('pushes an error toast for invalid manual form submit', () => {
    component.submitManualForm();

    expect(component.toasts()[0]?.type).toBe('error');
  });

  it('pushes success toast for dynamic form submit', () => {
    component.onDynamicSubmit({ firstName: 'Jane' });

    expect(component.toasts().some((toast) => toast.message.includes('Jane'))).toBe(true);
  });
});
