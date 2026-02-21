import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiModalComponent } from './ui-modal.component';

describe('UiModalComponent', () => {
  let fixture: ComponentFixture<UiModalComponent>;
  let component: UiModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Test Modal');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  });

  it('applies thin/normal/wide size classes', () => {
    fixture.componentRef.setInput('width', 'thin');
    fixture.detectChanges();
    expect(component.getWidthClass()).toContain('sm:max-w-md');

    fixture.componentRef.setInput('width', 'normal');
    fixture.detectChanges();
    expect(component.getWidthClass()).toContain('sm:max-w-2xl');

    fixture.componentRef.setInput('width', 'wide');
    fixture.detectChanges();
    expect(component.getWidthClass()).toContain('sm:max-w-5xl');
  });

  it('renders body container with internal scroll', () => {
    const root: HTMLElement = fixture.nativeElement;
    const body = root.querySelector('[data-testid=\"modal-body\"]');
    expect(body?.className).toContain('overflow-y-auto');
  });
});
