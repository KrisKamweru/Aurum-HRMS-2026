import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiButtonComponent } from './ui-button.component';

describe('UiButtonComponent', () => {
  let fixture: ComponentFixture<UiButtonComponent>;
  let component: UiButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('builds primary class set by default', () => {
    expect(component.getClasses()).toContain('bg-burgundy-700');
  });

  it('emits blocked when prerequisites are not met', () => {
    const blocked = vi.fn();
    const clicked = vi.fn();
    component.blocked.subscribe(blocked);
    component.onClick.subscribe(clicked);
    component.prerequisitesMet = false;

    component.handleClick(new MouseEvent('click'));

    expect(blocked).toHaveBeenCalled();
    expect(clicked).not.toHaveBeenCalled();
  });
});
