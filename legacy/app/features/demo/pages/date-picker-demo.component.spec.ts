import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePickerDemoComponent } from './date-picker-demo.component';

describe('DatePickerDemoComponent', () => {
  let fixture: ComponentFixture<DatePickerDemoComponent>;
  let component: DatePickerDemoComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerDemoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('updates selected dates when range changes', () => {
    const start = new Date('2026-02-01T00:00:00Z');
    const end = new Date('2026-02-10T00:00:00Z');

    component.onRangeChange({ start, end });

    expect(component.selectedStart()).toBe(start);
    expect(component.selectedEnd()).toBe(end);
  });

  it('formats dates for display', () => {
    const formatted = component.formatDate(new Date('2026-02-15T00:00:00Z'));
    expect(formatted.length).toBeGreaterThan(0);
  });
});
