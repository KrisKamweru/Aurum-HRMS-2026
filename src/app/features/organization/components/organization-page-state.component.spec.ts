import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationPageStateComponent } from './organization-page-state.component';

describe('OrganizationPageStateComponent', () => {
  let fixture: ComponentFixture<OrganizationPageStateComponent>;
  let component: OrganizationPageStateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationPageStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationPageStateComponent);
    component = fixture.componentInstance;
  });

  it('renders error state when error is provided', () => {
    fixture.componentRef.setInput('error', 'Request failed');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Request failed');
  });

  it('renders loading state when loading and no error', () => {
    fixture.componentRef.setInput('isLoading', true);
    fixture.componentRef.setInput('hasData', false);
    fixture.componentRef.setInput('loadingLabel', 'Loading departments...');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Loading departments...');
  });

  it('renders empty state when not loading and no data', () => {
    fixture.componentRef.setInput('hasData', false);
    fixture.componentRef.setInput('emptyTitle', 'No departments found');
    fixture.componentRef.setInput('emptyMessage', 'Create a department to get started.');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('No departments found');
    expect(root.textContent).toContain('Create a department to get started.');
  });
});
