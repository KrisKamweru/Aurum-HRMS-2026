import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalsDemoComponent } from './modals-demo.component';

describe('ModalsDemoComponent', () => {
  let fixture: ComponentFixture<ModalsDemoComponent>;
  let component: ModalsDemoComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalsDemoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalsDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('opens modal with selected width preset', () => {
    component.openModal('wide');

    expect(component.activeModalKind()).toBe('wide');
    expect(component.resolvedModalWidth()).toBe('wide');
  });

  it('records confirm dialog responses as toasts', () => {
    component.handleConfirm('Approved for demo');

    expect(component.toasts()[0]?.message).toContain('Approved for demo');
  });
});
