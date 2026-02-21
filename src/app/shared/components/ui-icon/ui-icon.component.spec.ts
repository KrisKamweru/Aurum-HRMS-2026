import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiIconComponent } from './ui-icon.component';

describe('UiIconComponent', () => {
  let fixture: ComponentFixture<UiIconComponent>;
  let component: UiIconComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiIconComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiIconComponent);
    component = fixture.componentInstance;
    component.name = 'check';
    fixture.detectChanges();
  });

  it('renders inline svg for known icons', () => {
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('falls back for unknown names', () => {
    fixture.componentRef.setInput('name', 'unknown');
    fixture.detectChanges();

    const path = fixture.nativeElement.querySelector('path');
    expect(path).toBeTruthy();
  });
});
