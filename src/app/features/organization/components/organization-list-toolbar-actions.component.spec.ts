import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { OrganizationListToolbarActionsComponent } from './organization-list-toolbar-actions.component';

describe('OrganizationListToolbarActionsComponent', () => {
  let fixture: ComponentFixture<OrganizationListToolbarActionsComponent>;
  let component: OrganizationListToolbarActionsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationListToolbarActionsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationListToolbarActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders configured refresh and create labels', () => {
    fixture.componentRef.setInput('refreshLabel', 'Reload');
    fixture.componentRef.setInput('createLabel', 'Add Record');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const buttons = host.querySelectorAll('button');

    expect((buttons[0] as HTMLButtonElement).textContent).toContain('Reload');
    expect((buttons[1] as HTMLButtonElement).textContent).toContain('Add Record');
  });

  it('emits refresh/create events and disables both actions', () => {
    const refreshSpy = vi.spyOn(component.refreshRequested, 'emit');
    const createSpy = vi.spyOn(component.createRequested, 'emit');
    const host = fixture.nativeElement as HTMLElement;
    const buttons = host.querySelectorAll('button');

    (buttons[0] as HTMLButtonElement).click();
    (buttons[1] as HTMLButtonElement).click();

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect((buttons[0] as HTMLButtonElement).disabled).toBe(true);
    expect((buttons[1] as HTMLButtonElement).disabled).toBe(true);
  });
});
