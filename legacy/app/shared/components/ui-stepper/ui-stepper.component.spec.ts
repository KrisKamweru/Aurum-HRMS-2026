import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiStepperComponent } from './ui-stepper.component';

describe('UiStepperComponent', () => {
  let fixture: ComponentFixture<UiStepperComponent>;
  let component: UiStepperComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiStepperComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiStepperComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stepsData', [
      { title: 'One' },
      { title: 'Two' }
    ]);
    fixture.detectChanges();
  });

  it('advances and emits step changes', () => {
    const emitted = vi.fn();
    component.stepChange.subscribe(emitted);

    component.next();

    expect(component.currentStep()).toBe(1);
    expect(emitted).toHaveBeenCalledWith(1);
  });

  it('prevents linear jump to future step', () => {
    expect(component.canNavigateToStep(1)).toBe(false);
  });
});
