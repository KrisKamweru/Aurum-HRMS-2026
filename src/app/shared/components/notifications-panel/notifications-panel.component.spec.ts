import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationItem, NotificationsPanelComponent } from './notifications-panel.component';

describe('NotificationsPanelComponent', () => {
  let fixture: ComponentFixture<NotificationsPanelComponent>;
  let component: NotificationsPanelComponent;

  const notifications: NotificationItem[] = [
    {
      id: 'n1',
      title: 'Payroll finalized',
      message: 'February payroll run complete.',
      type: 'success',
      isRead: false,
      createdAt: new Date('2026-02-21T10:00:00Z').toISOString()
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsPanelComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsPanelComponent);
    component = fixture.componentInstance;
    component.isOpen = true;
    component.notifications = notifications;
    fixture.detectChanges();
  });

  it('renders notification rows when open', () => {
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Payroll finalized');
  });

  it('emits markRead with notification id', () => {
    const markRead = vi.fn();
    component.markRead.subscribe(markRead);

    component.handleMarkRead('n1');

    expect(markRead).toHaveBeenCalledWith('n1');
  });
});
