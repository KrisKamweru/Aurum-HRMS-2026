import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationTableMetadataComponent } from './organization-table-metadata.component';

describe('OrganizationTableMetadataComponent', () => {
  let fixture: ComponentFixture<OrganizationTableMetadataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationTableMetadataComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationTableMetadataComponent);
  });

  it('renders count and label with default last-refreshed fallback', () => {
    fixture.componentRef.setInput('itemLabel', 'Departments');
    fixture.componentRef.setInput('count', 4);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('4');
    expect(root.textContent).toContain('Departments');
    expect(root.textContent).toContain('Never');
  });

  it('renders formatted last-refreshed timestamp when provided', () => {
    fixture.componentRef.setInput('itemLabel', 'Locations');
    fixture.componentRef.setInput('count', 2);
    fixture.componentRef.setInput('lastRefreshedAt', new Date(2026, 1, 21, 16, 45));
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('2026-02-21 16:45');
  });
});
