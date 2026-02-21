import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiGridTileComponent } from './ui-grid-tile.component';

describe('UiGridTileComponent', () => {
  let fixture: ComponentFixture<UiGridTileComponent>;
  let component: UiGridTileComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiGridTileComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiGridTileComponent);
    component = fixture.componentInstance;
    component.title = 'Tile';
    fixture.detectChanges();
  });

  it('renders configured title', () => {
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Tile');
  });

  it('applies variant class', () => {
    fixture.componentRef.setInput('variant', 'glass');
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('header')?.className).toContain('bg-white/[0.72]');
  });
});
