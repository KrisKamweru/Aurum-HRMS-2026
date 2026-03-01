import { CommonModule } from '@angular/common';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

import { UiIconComponent } from '../ui-icon/ui-icon.component';

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
  imports: [CommonModule, UiIconComponent],
  template: `
    @if (isOpen()) {
      <div 
        class="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-3xl glass-surface shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-300 transform origin-top-right"
      >
        <!-- Header -->
        <div class="px-5 py-4 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-transparent">
          <h3 class="text-base font-display font-semibold text-slate-900 dark:text-white">Notifications</h3>
          <div class="flex items-center gap-2">
            <button 
              (click)="markAllRead.emit()" 
              class="text-[11px] font-semibold tracking-wide text-primary-700 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors uppercase"
            >
              Mark all read
            </button>
            <button 
              (click)="close.emit()" 
              class="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <ui-icon name="x-mark" class="w-4 h-4"></ui-icon>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="max-h-[400px] overflow-y-auto scrollbar-custom bg-transparent">
          @if (notifications().length === 0) {
            <div class="px-5 py-12 text-center flex flex-col items-center justify-center">
              <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3">
                <ui-icon name="bell" class="w-6 h-6 text-slate-400"></ui-icon>
              </div>
              <p class="text-sm font-body text-slate-500 dark:text-slate-400">No new notifications</p>
            </div>
          } @else {
            <div class="divide-y divide-black/5 dark:divide-white/5">
              @for (note of notifications(); track note.id) {
                <div 
                  class="px-5 py-4 flex gap-4 transition-colors hover:bg-[var(--color-bg-surface-elevated)] cursor-pointer relative group"
                  [class.bg-primary-50]="!note.isRead"
                  [class.dark:bg-primary-900/10]="!note.isRead"
                  (click)="select.emit(note.id)"
                >
                  <!-- indicator -->
                  @if (!note.isRead) {
                    <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 dark:bg-primary-500 rounded-r-full"></div>
                  }
                  
                  <div class="flex-shrink-0 mt-0.5">
                    @if (note.type === 'success') {
                      <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <ui-icon name="check-circle" class="w-4 h-4"></ui-icon>
                      </div>
                    } @else if (note.type === 'warning') {
                      <div class="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <ui-icon name="exclamation-triangle" class="w-4 h-4"></ui-icon>
                      </div>
                    } @else if (note.type === 'error') {
                      <div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                        <ui-icon name="x-circle" class="w-4 h-4"></ui-icon>
                      </div>
                    } @else {
                      <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <ui-icon name="information-circle" class="w-4 h-4"></ui-icon>
                      </div>
                    }
                  </div>

                  <div class="flex-1 min-w-0 pr-6 relative">
                    <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">{{ note.title }}</p>
                    <p class="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{{ note.message }}</p>
                    <p class="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wide">{{ note.createdAt }}</p>

                    @if (!note.isRead) {
                      <button 
                        class="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
                        (click)="handleMarkRead(note.id); $event.stopPropagation()"
                        title="Mark as read"
                      >
                        <ui-icon name="check" class="w-3.5 h-3.5"></ui-icon>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
        
        <!-- Footer -->
        <div class="px-5 py-3 border-t border-black/5 dark:border-white/5 bg-transparent text-center">
          <button 
            (click)="clearAll.emit()" 
            class="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            Clear all notifications
          </button>
        </div>
      </div>
    }
  `
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



