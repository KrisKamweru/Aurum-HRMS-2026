import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowcaseSixComponent } from './design-six.component';

describe('ShowcaseSixComponent', () => {
  let fixture: ComponentFixture<ShowcaseSixComponent>;
  let observeSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    observeSpy = vi.fn();
    const unobserveSpy = vi.fn();
    const disconnectSpy = vi.fn();

    class IntersectionObserverStub {
      constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
      observe = observeSpy;
      unobserve = unobserveSpy;
      disconnect = disconnectSpy;
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
      readonly root = null;
      readonly rootMargin = '0px';
      readonly thresholds = [];
    }

    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);

    await TestBed.configureTestingModule({
      imports: [ShowcaseSixComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ShowcaseSixComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders and marks the page as loaded after initial render', async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(fixture.componentInstance.loaded()).toBe(true);
    expect((fixture.nativeElement.textContent as string)).toContain('Aurum');
    expect(observeSpy).toHaveBeenCalled();
  });
});
