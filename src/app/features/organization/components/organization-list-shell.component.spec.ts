import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationListShellComponent } from './organization-list-shell.component';

@Component({
  standalone: true,
  imports: [OrganizationListShellComponent],
  template: `
    <app-organization-list-shell
      title="Departments"
      description="Department management for the rebuild."
      actionMessage="Use action controls to refresh data and add records."
    >
      <section org-list-page-state data-testid="page-state">state content</section>
      <span org-list-status data-testid="status-chip">Live Sync</span>
      <span org-list-status data-testid="status-chip">2 Alerts</span>
      <button type="button" org-list-toolbar-actions>Refresh</button>
      <button type="button" org-list-toolbar-actions>Add Department</button>
      <section org-list-table-content data-testid="table-content">table content</section>
    </app-organization-list-shell>
  `
})
class OrganizationListShellHostComponent {}

describe('OrganizationListShellComponent', () => {
  let fixture: ComponentFixture<OrganizationListShellHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationListShellHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationListShellHostComponent);
    fixture.detectChanges();
  });

  it('renders heading and action copy', () => {
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Organization Rebuild');
    expect(root.textContent).toContain('Departments');
    expect(root.textContent).toContain('Department management for the rebuild.');
    expect(root.textContent).toContain('Use action controls to refresh data and add records.');
  });

  it('projects page-state, status, toolbar actions, and table content slots', () => {
    const root = fixture.nativeElement as HTMLElement;
    const status = root.querySelector('[data-testid="org-list-shell-status"]');
    const actions = root.querySelector('[data-testid="org-list-shell-actions"]');

    expect(root.querySelector('[data-testid="page-state"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="table-content"]')).not.toBeNull();
    expect(status?.querySelectorAll('[data-testid="status-chip"]').length).toBe(2);
    expect(status?.textContent).toContain('Live Sync');
    expect(actions?.querySelectorAll('button').length).toBe(2);
    expect(actions?.textContent).toContain('Refresh');
    expect(actions?.textContent).toContain('Add Department');
  });
});
