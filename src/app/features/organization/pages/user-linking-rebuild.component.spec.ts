import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserLinkingRebuildComponent } from './user-linking-rebuild.component';

describe('UserLinkingRebuildComponent', () => {
  let fixture: ComponentFixture<UserLinkingRebuildComponent>;
  let component: UserLinkingRebuildComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserLinkingRebuildComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UserLinkingRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts with pending links', () => {
    expect(component.pendingLinks().length).toBe(2);
    expect(component.linkedCount()).toBe(0);
  });

  it('links a pending candidate', () => {
    const target = component.pendingLinks()[0];
    component.linkCandidate(target.id);

    expect(component.pendingLinks().some((row) => row.id === target.id)).toBe(false);
    expect(component.linkedCount()).toBe(1);
  });
});
