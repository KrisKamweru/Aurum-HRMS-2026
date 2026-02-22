import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RebuildHomeComponent } from './rebuild-home.component';

describe('RebuildHomeComponent', () => {
  let fixture: ComponentFixture<RebuildHomeComponent>;
  let component: RebuildHomeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RebuildHomeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RebuildHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders rebuild heading', () => {
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Aurum HRMS Rebuild');
  });

  it('exposes phase label', () => {
    expect(component.phaseLabel).toBe('Phase 2: Legacy archived');
  });
});
