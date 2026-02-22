import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { OrganizationTableActionsComponent } from './organization-table-actions.component';

describe('OrganizationTableActionsComponent', () => {
  let fixture: ComponentFixture<OrganizationTableActionsComponent>;
  let component: OrganizationTableActionsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationTableActionsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationTableActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits edit and remove requests when action buttons are clicked', () => {
    const editSpy = vi.spyOn(component.editRequested, 'emit');
    const removeSpy = vi.spyOn(component.removeRequested, 'emit');
    const host = fixture.nativeElement as HTMLElement;
    const buttons = host.querySelectorAll('button');

    (buttons[0] as HTMLButtonElement).click();
    (buttons[1] as HTMLButtonElement).click();

    expect(editSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const editSpy = vi.spyOn(component.editRequested, 'emit');
    const removeSpy = vi.spyOn(component.removeRequested, 'emit');
    const host = fixture.nativeElement as HTMLElement;
    const buttons = host.querySelectorAll('button');
    const editButton = buttons[0] as HTMLButtonElement;
    const removeButton = buttons[1] as HTMLButtonElement;

    expect(editButton.disabled).toBe(true);
    expect(removeButton.disabled).toBe(true);

    editButton.click();
    removeButton.click();

    expect(editSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
  });
});
