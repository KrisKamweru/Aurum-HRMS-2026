import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiStepperComponent, StepperStepConfig } from '../../../shared/components/ui-stepper/ui-stepper.component';
import { ToastMessage, UiToastComponent } from '../../../shared/components/ui-toast/ui-toast.component';
import { NotificationsPanelComponent, NotificationItem } from '../../../shared/components/notifications-panel/notifications-panel.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-extras-demo',
  imports: [UiCardComponent, UiButtonComponent, UiStepperComponent, UiToastComponent, NotificationsPanelComponent],
  template: `
    <div class="space-y-2 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div>
        <h1 class="text-3xl font-display font-semibold text-slate-900 dark:text-white">Stepper & Notifications</h1>
        <p class="text-text-muted mt-1">Multi-step workflows and notification panel component.</p>
      </div>

      <!-- Stepper -->
      <ui-card variant="glass" padding="lg" title="Stepper" subtitle="Multi-step wizard with linear progression">
        <div class="mt-4">
          <ui-stepper
            [stepsData]="stepperSteps"
            submitText="Complete Setup"
            (stepChange)="onStepChange($event)"
            (submitEvent)="onStepperSubmit()"
          ></ui-stepper>
        </div>
      </ui-card>

      <!-- Notifications Panel -->
      <div class="glass-surface rounded-2xl border border-border-glass overflow-visible p-6">
        <div class="mb-1">
          <h3 class="text-display font-medium text-lg leading-6">Notifications Panel</h3>
          <p class="mt-1 text-sm text-text-muted">Dropdown panel with read/unread state, anchored to a trigger button.</p>
        </div>
        <div class="mt-4 flex gap-3">
          <div class="relative">
            <ui-button variant="primary" icon="bell" (onClick)="notificationsOpen.set(!notificationsOpen())">
              {{ notificationsOpen() ? 'Close' : 'Open' }} Panel
            </ui-button>
            <app-notifications-panel
              [isOpen]="notificationsOpen()"
              [notifications]="notifications()"
              (close)="notificationsOpen.set(false)"
              (clearAll)="notifications.set([])"
              (markAllRead)="markAllRead()"
              (markRead)="markRead($event)"
              (select)="selectNotification($event)"
            ></app-notifications-panel>
          </div>
          <ui-button variant="ghost" (onClick)="resetNotifications()">Reset Data</ui-button>
        </div>
      </div>

      <!-- Toast Triggers -->
      <ui-card variant="glass" title="Toast Notifications" subtitle="Trigger each toast variant">
        <div class="flex flex-wrap gap-3 mt-4">
          <ui-button variant="primary" (onClick)="pushToast('success', 'Employee onboarded successfully.')">Success</ui-button>
          <ui-button variant="outline" (onClick)="pushToast('info', 'Payroll processing will begin at midnight.')">Info</ui-button>
          <ui-button variant="gold" (onClick)="pushToast('warning', 'Leave balance is running low.')">Warning</ui-button>
          <ui-button variant="danger" (onClick)="pushToast('error', 'Failed to sync timesheet data.')">Error</ui-button>
          <ui-button variant="ghost" (onClick)="toasts.set([])">Clear All</ui-button>
        </div>
      </ui-card>
    </div>

    <ui-toast [toasts]="toasts()" (dismiss)="dismissToast($event)"></ui-toast>
  `
})
export class ExtrasDemoComponent {
  readonly toasts = signal<ToastMessage[]>([]);
  readonly notificationsOpen = signal(false);

  readonly stepperSteps: StepperStepConfig[] = [
    { title: 'Account', subtitle: 'Sign-in details' },
    { title: 'Profile', subtitle: 'Personal info' },
    { title: 'Preferences', subtitle: 'Settings' },
    { title: 'Review', subtitle: 'Confirm & submit' }
  ];

  private readonly defaultNotifications: NotificationItem[] = [
    { id: '1', title: 'Leave Approved', message: 'Your annual leave for March 15-20 has been approved.', type: 'success', isRead: false, createdAt: '2 hours ago' },
    { id: '2', title: 'Timesheet Reminder', message: 'Please submit your timesheet for this week before Friday.', type: 'warning', isRead: false, createdAt: '5 hours ago' },
    { id: '3', title: 'Sync Error', message: 'Payroll data failed to sync with the external provider.', type: 'error', isRead: true, createdAt: '1 day ago' },
    { id: '4', title: 'New Policy Update', message: 'Remote work policy has been updated. Review the changes.', type: 'info', isRead: true, createdAt: '2 days ago' }
  ];

  readonly notifications = signal<NotificationItem[]>([...this.defaultNotifications]);

  onStepChange(step: number): void {
    this.pushToast('info', `Navigated to step ${step + 1}.`);
  }

  onStepperSubmit(): void {
    this.pushToast('success', 'Stepper completed successfully!');
  }

  markAllRead(): void {
    this.notifications.update(items => items.map(n => ({ ...n, isRead: true })));
  }

  markRead(id: string): void {
    this.notifications.update(items => items.map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  selectNotification(id: string): void {
    this.pushToast('info', `Notification ${id} selected.`);
    this.markRead(id);
  }

  resetNotifications(): void {
    this.notifications.set([...this.defaultNotifications]);
  }

  pushToast(type: ToastMessage['type'], message: string): void {
    const id = `toast-${Date.now()}-${this.toasts().length}`;
    this.toasts.update(items => [...items, { id, type, message }]);
  }

  dismissToast(id: string): void {
    this.toasts.update(items => items.filter(t => t.id !== id));
  }
}
