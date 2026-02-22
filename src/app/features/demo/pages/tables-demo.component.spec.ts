import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TablesDemoComponent } from './tables-demo.component';

describe('TablesDemoComponent', () => {
  let fixture: ComponentFixture<TablesDemoComponent>;
  let component: TablesDemoComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablesDemoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TablesDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sorts rows by salary ascending', () => {
    component.onSort({ key: 'salary', direction: 'asc' });

    expect(component.rows()[0]?.name).toBe('Bob Smith');
  });

  it('tracks selected row on row click', () => {
    component.onRowClick({ name: 'Alice Johnson' });

    expect(component.selectedRowName()).toBe('Alice Johnson');
  });
});
