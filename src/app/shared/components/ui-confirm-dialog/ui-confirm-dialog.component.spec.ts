import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiConfirmDialogComponent } from './ui-confirm-dialog.component';

describe('UiConfirmDialogComponent', () => {
  let fixture: ComponentFixture<UiConfirmDialogComponent>;
  let component: UiConfirmDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiConfirmDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiConfirmDialogComponent);
    component = fixture.componentInstance;
    component.isOpen = true;
    fixture.detectChanges();
  });

  it('renders title when open', () => {
    fixture.componentRef.setInput('options', { title: 'Delete record', message: 'Confirm delete.' });
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Delete record');
  });

  it('emits close and cancel when dismissed', () => {
    const close = vi.fn();
    const cancel = vi.fn();
    component.isOpenChange.subscribe(close);
    component.cancel.subscribe(cancel);

    component.dismiss();

    expect(close).toHaveBeenCalledWith(false);
    expect(cancel).toHaveBeenCalled();
  });
});
