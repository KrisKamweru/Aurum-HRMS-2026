import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiDataTableComponent, TableColumn } from './ui-data-table.component';

describe('UiDataTableComponent', () => {
  let fixture: ComponentFixture<UiDataTableComponent>;
  let component: UiDataTableComponent;

  const columns: TableColumn[] = [
    { key: 'name', header: 'Name', sortable: true, type: 'text' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiDataTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiDataTableComponent);
    component = fixture.componentInstance;
    component.columns = columns;
    component.data = [{ id: '1', name: 'Amina' }];
    fixture.detectChanges();
  });

  it('renders row data', () => {
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Amina');
  });

  it('emits sort change for sortable column', () => {
    const emitted = vi.fn();
    component.sortChange.subscribe(emitted);

    component.handleSort(columns[0]);

    expect(emitted).toHaveBeenCalledWith({ key: 'name', direction: 'asc' });
  });
});
