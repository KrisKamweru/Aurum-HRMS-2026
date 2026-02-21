import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
  });

  it('uses internal scroll shell wrapper', () => {
    const root: HTMLElement = fixture.nativeElement;
    const viewport = root.querySelector('[data-testid="app-viewport"]');
    const scroller = root.querySelector('[data-testid="app-scroller"]');
    expect(viewport?.className).toContain('overflow-hidden');
    expect(scroller?.className).toContain('overflow-y-auto');
  });
});
