import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastMessage, UiToastComponent } from './ui-toast.component';

describe('UiToastComponent', () => {
  let fixture: ComponentFixture<UiToastComponent>;
  let component: UiToastComponent;

  const toasts: ToastMessage[] = [
    { id: 't1', type: 'success', message: 'Saved' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiToastComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiToastComponent);
    component = fixture.componentInstance;
    component.toasts = toasts;
    fixture.detectChanges();
  });

  it('renders toast message content', () => {
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Saved');
  });

  it('emits dismiss for toast id', () => {
    const dismiss = vi.fn();
    component.dismiss.subscribe(dismiss);

    component.dismissToast('t1');

    expect(dismiss).toHaveBeenCalledWith('t1');
  });
});
