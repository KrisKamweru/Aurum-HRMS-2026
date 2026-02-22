import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DemoShellComponent } from './demo-shell.component';

describe('DemoShellComponent', () => {
  let fixture: ComponentFixture<DemoShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemoShellComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(DemoShellComponent);
    fixture.detectChanges();
  });

  it('renders demo navigation links', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Shared UI Kit');
    expect(text).toContain('Buttons & Badges');
    expect(text).toContain('Forms & Dynamic Form');
    expect(text).toContain('Open Showcase /6');
  });
});
