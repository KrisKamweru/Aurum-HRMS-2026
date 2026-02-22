import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiCardComponent } from './ui-card.component';

describe('UiCardComponent', () => {
  let fixture: ComponentFixture<UiCardComponent>;
  let component: UiCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('uses default variant classes', () => {
    expect(component.getContainerClasses()).toContain('border-stone-200');
  });

  it('applies accent padding to body', () => {
    fixture.componentRef.setInput('accent', 'bg-burgundy-700');
    fixture.detectChanges();

    expect(component.bodyClasses()).toContain('pl-8');
  });
});
