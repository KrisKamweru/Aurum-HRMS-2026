import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
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
    expect(root.querySelector('button')?.textContent).toContain('Retry');
  });

  it('emits retry when retry action is clicked in error state', () => {
    fixture.componentRef.setInput('error', 'Request failed');
    fixture.detectChanges();
    const retrySpy = vi.spyOn(component.retryRequested, 'emit');
    const root = fixture.nativeElement as HTMLElement;
    const retryButton = root.querySelector('button') as HTMLButtonElement;

    retryButton.click();

    expect(retrySpy).toHaveBeenCalledTimes(1);
  });

  it('hides retry action when showRetry is false', () => {
    fixture.componentRef.setInput('error', 'Request failed');
    fixture.componentRef.setInput('showRetry', false);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('button')).toBeNull();
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
