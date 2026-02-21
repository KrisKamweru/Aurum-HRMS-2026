import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationTableColumn, OrganizationTableHeaderRowComponent } from './organization-table-header-row.component';

@Component({
  standalone: true,
  imports: [OrganizationTableHeaderRowComponent],
  template: `
    <table>
      <thead app-organization-table-header-row [columns]="columns"></thead>
    </table>
  `
})
class OrganizationTableHeaderRowHostComponent {
  readonly columns: OrganizationTableColumn[] = [
    { label: 'Name' },
    { label: 'Code' },
    { label: 'Actions', align: 'right' }
  ];
}

describe('OrganizationTableHeaderRowComponent', () => {
  let fixture: ComponentFixture<OrganizationTableHeaderRowHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationTableHeaderRowHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationTableHeaderRowHostComponent);
    fixture.detectChanges();
  });

  it('renders each configured column label', () => {
    const root = fixture.nativeElement as HTMLElement;
    const headers = Array.from(root.querySelectorAll('th')).map((cell) => cell.textContent?.trim() ?? '');

    expect(headers).toEqual(['Name', 'Code', 'Actions']);
  });

  it('applies right alignment on right-aligned columns', () => {
    const root = fixture.nativeElement as HTMLElement;
    const headers = root.querySelectorAll('th');

    expect((headers[0] as HTMLTableCellElement).classList.contains('text-right')).toBe(false);
    expect((headers[2] as HTMLTableCellElement).classList.contains('text-right')).toBe(true);
  });
});
