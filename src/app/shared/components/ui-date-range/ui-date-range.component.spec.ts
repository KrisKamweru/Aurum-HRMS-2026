import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiDateRangeComponent } from './ui-date-range.component';

describe('UiDateRangeComponent', () => {
  let fixture: ComponentFixture<UiDateRangeComponent>;
  let component: UiDateRangeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiDateRangeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiDateRangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits range when selecting preset', () => {
    const emitted = vi.fn();
    component.rangeChange.subscribe(emitted);

    component.selectPreset('last30');

    expect(emitted).toHaveBeenCalled();
  });

  it('shows fallback label when no selection is active', () => {
    expect(component.formatRange()).toContain('Select a date range');
  });
});
