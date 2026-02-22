import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonsDemoComponent } from './buttons-demo.component';

describe('ButtonsDemoComponent', () => {
  let fixture: ComponentFixture<ButtonsDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonsDemoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonsDemoComponent);
    fixture.detectChanges();
  });

  it('renders shared UI primitive sections', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Buttons, Badges & Avatars');
    expect(text).toContain('Buttons');
    expect(text).toContain('Badges');
    expect(text).toContain('Avatars');
  });
});
