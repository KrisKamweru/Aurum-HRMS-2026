import { CommonModule } from '@angular/common';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-notifications-panel',
  imports: [CommonModule],
  template: ''
})
export class NotificationsPanelComponent {
  readonly isOpen = input(false);
  readonly notifications = input<NotificationItem[]>([]);

  readonly close = output<void>();
  readonly clearAll = output<void>();
  readonly markAllRead = output<void>();
  readonly markRead = output<string>();
  readonly select = output<string>();

  handleMarkRead(id: string): void {
    this.markRead.emit(id);
  }
}



