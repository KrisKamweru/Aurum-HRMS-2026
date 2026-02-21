import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiAvatarComponent } from './ui-avatar.component';

describe('UiAvatarComponent', () => {
  let fixture: ComponentFixture<UiAvatarComponent>;
  let component: UiAvatarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiAvatarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders initials when no src is set', () => {
    fixture.componentRef.setInput('name', 'Amina Hassan');
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('AH');
  });

  it('uses configured avatar size class', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();

    expect(component.containerClasses()).toContain('w-12');
  });
});
