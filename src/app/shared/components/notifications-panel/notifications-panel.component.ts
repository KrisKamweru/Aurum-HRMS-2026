import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

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
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-[900]" (click)="close.emit()"></div>
      <section class="absolute right-0 z-[901] mt-2 w-80 overflow-hidden rounded-2xl border border-white/[0.55] bg-white/[0.82] shadow-xl backdrop-blur-xl dark:border-white/8 dark:bg-white/10 sm:w-96">
        <header class="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-white/8">
          <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100">Notifications</h3>
          <div class="flex items-center gap-3">
            <button type="button" class="text-xs font-medium text-burgundy-700 dark:text-burgundy-300" (click)="markAllRead.emit()">Mark all read</button>
            <button type="button" class="text-xs font-medium text-stone-500 dark:text-stone-300" (click)="clearAll.emit()">Clear</button>
          </div>
        </header>

        <div class="max-h-[420px] overflow-y-auto">
          @if (notifications.length === 0) {
            <p class="px-4 py-8 text-center text-sm text-stone-500 dark:text-stone-400">No notifications yet</p>
          } @else {
            <div class="divide-y divide-stone-100 dark:divide-white/10">
              @for (notification of notifications; track notification.id) {
                <button type="button" class="w-full px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-white/10" (click)="select.emit(notification.id)">
                  <div class="mb-1 flex items-center justify-between gap-2">
                    <p class="text-sm font-semibold text-stone-900 dark:text-stone-100">{{ notification.title }}</p>
                    <span class="text-[11px] text-stone-500 dark:text-stone-400">{{ notification.createdAt | date:'shortTime' }}</span>
                  </div>
                  <p class="text-xs text-stone-600 dark:text-stone-300">{{ notification.message }}</p>
                  @if (!notification.isRead) {
                    <span class="mt-2 inline-flex rounded-full bg-burgundy-100 px-2 py-0.5 text-[11px] font-semibold text-burgundy-700 dark:bg-burgundy-700/20 dark:text-burgundy-300" (click)="$event.stopPropagation(); handleMarkRead(notification.id)">Mark read</span>
                  }
                </button>
              }
            </div>
          }
        </div>
      </section>
    }
  `
})
export class NotificationsPanelComponent {
  @Input() isOpen = false;
  @Input() notifications: NotificationItem[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() markAllRead = new EventEmitter<void>();
  @Output() markRead = new EventEmitter<string>();
  @Output() select = new EventEmitter<string>();

  handleMarkRead(id: string): void {
    this.markRead.emit(id);
  }
}

