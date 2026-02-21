import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiGridComponent } from './ui-grid.component';

describe('UiGridComponent', () => {
  let fixture: ComponentFixture<UiGridComponent>;
  let component: UiGridComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiGridComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('applies configured column template style var', () => {
    fixture.componentRef.setInput('columns', '1fr 2fr');
    fixture.detectChanges();

    const div: HTMLDivElement | null = fixture.nativeElement.querySelector('div');
    expect(div?.style.getPropertyValue('--ui-grid-columns')).toBe('1fr 2fr');
  });
});
