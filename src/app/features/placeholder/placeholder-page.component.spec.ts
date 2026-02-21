import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { PlaceholderPageComponent } from './placeholder-page.component';

describe('PlaceholderPageComponent', () => {
  let fixture: ComponentFixture<PlaceholderPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaceholderPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ title: 'Test Route' }),
            snapshot: { routeConfig: { path: 'test-path' } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlaceholderPageComponent);
    fixture.detectChanges();
  });

  it('renders route title from route data', () => {
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Test Route');
  });

  it('renders the configured path', () => {
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('test-path');
  });
});
