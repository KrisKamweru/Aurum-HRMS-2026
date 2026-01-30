import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { ConvexClientService } from './convex-client.service';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { AuthService } from '../auth/auth.service';

export interface Notification {
  _id: Id<"notifications">;
  _creationTime: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private convex = inject(ConvexClientService);
  private authService = inject(AuthService);

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  isOpen = signal(false);

  constructor() {
    // Subscribe to notifications when user is logged in
    effect(() => {
      const user = this.authService.getUser()();
      if (user) {
        this.subscribeToNotifications();
      } else {
        this.notifications.set([]);
        this.unreadCount.set(0);
      }
    });
  }

  private subscribeToNotifications() {
    const client = this.convex.getClient();

    // Watch for new notifications
    client.onUpdate(api.notifications.list, { limit: 20 }, (data) => {
      this.notifications.set(data as Notification[]);
    });

    // Watch for unread count
    client.onUpdate(api.notifications.unreadCount, {}, (count) => {
      this.unreadCount.set(count);
    });
  }

  togglePanel() {
    this.isOpen.update(v => !v);
  }

  closePanel() {
    this.isOpen.set(false);
  }

  async markAsRead(id: Id<"notifications">) {
    try {
      await this.convex.getClient().mutation(api.notifications.markAsRead, { id });
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  }

  async markAllAsRead() {
    try {
      await this.convex.getClient().mutation(api.notifications.markAllAsRead, {});
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  }

  async clearAll() {
    try {
      await this.convex.getClient().mutation(api.notifications.clearAll, {});
    } catch (e) {
      console.error('Failed to clear notifications', e);
    }
  }
}
