import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UiNavItemComponent } from './ui-nav-item.component';

describe('UiNavItemComponent', () => {
  let fixture: ComponentFixture<UiNavItemComponent>;
  let component: UiNavItemComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiNavItemComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(UiNavItemComponent);
    component = fixture.componentInstance;
    component.route = '/dashboard';
    fixture.detectChanges();
  });

  it('renders anchor link', () => {
    const anchor: HTMLAnchorElement | null = fixture.nativeElement.querySelector('a');
    expect(anchor).toBeTruthy();
  });

  it('renders badge when provided', () => {
    fixture.componentRef.setInput('badge', '3');
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('3');
  });
});
