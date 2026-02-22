import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiBadgeComponent } from './ui-badge.component';

describe('UiBadgeComponent', () => {
  let fixture: ComponentFixture<UiBadgeComponent>;
  let component: UiBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders badge host span', () => {
    const span = fixture.nativeElement.querySelector('span');
    expect(span).toBeTruthy();
  });

  it('applies success variant classes', () => {
    fixture.componentRef.setInput('variant', 'success');
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();

    expect(component.getClasses()).toContain('text-xs');
    expect(component.getClasses()).toContain('emerald');
  });
});
