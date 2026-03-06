import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { ToastMessage, UiToastComponent } from '../../../shared/components/ui-toast/ui-toast.component';

type DemoModalKind = 'thin' | 'normal' | 'wide' | null;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-modals-demo',
  imports: [UiButtonComponent, UiCardComponent, UiModalComponent, UiConfirmDialogComponent, UiToastComponent],
  template: `
    <div class="space-y-2 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div>
        <h1 class="text-3xl font-display font-semibold text-slate-900 dark:text-white">Modals &amp; Dialogs</h1>
        <p class="text-text-muted mt-1">Overlay components for alerts, confirmations, and focused tasks.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <!-- Modal Width Variants -->
        <ui-card variant="glass" title="Modal Widths" subtitle="Thin, Normal, and Wide variants">
          <div class="flex flex-wrap gap-3 mt-4">
            <ui-button variant="secondary" (onClick)="openModal('thin')">Open Thin Modal</ui-button>
            <ui-button variant="primary" (onClick)="openModal('normal')">Open Normal Modal</ui-button>
            <ui-button variant="outline" (onClick)="openModal('wide')">Open Wide Modal</ui-button>
          </div>
        </ui-card>

        <!-- Confirm Dialog -->
        <ui-card variant="glass" title="Confirm Dialog" subtitle="With required reason input">
          <div class="flex flex-wrap gap-3 mt-4">
            <ui-button variant="danger" (onClick)="openConfirm()">Open Confirm Dialog</ui-button>
            <ui-button variant="ghost" (onClick)="clearToasts()">Clear Toasts</ui-button>
          </div>
        </ui-card>
      </div>
    </div>

    <!-- Modal Instance -->
    @if (activeModalKind()) {
      <ui-modal [isOpen]="true" [width]="resolvedModalWidth()" (close)="closeModal()">
        <div class="space-y-4">
          <h2 class="text-xl font-display font-semibold text-slate-900 dark:text-white capitalize">{{ activeModalKind() }} Modal</h2>
          <p class="text-text-muted text-sm">This is a <strong>{{ activeModalKind() }}</strong> width modal demonstrating the glassmorphic overlay.</p>
          <div class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            @for (line of fillerLines; track line) {
              <p>{{ line }}</p>
            }
          </div>
          <div class="flex justify-end gap-3 pt-4 border-t border-border-glass">
            <ui-button variant="ghost" (onClick)="closeModal()">Cancel</ui-button>
            <ui-button variant="primary" (onClick)="confirmModalAction()">Confirm</ui-button>
          </div>
        </div>
      </ui-modal>
    }

    <!-- Confirm Dialog Instance -->
    <ui-confirm-dialog
      [isOpen]="confirmOpen()"
      [options]="confirmOptions"
      (confirm)="handleConfirm($event)"
      (cancel)="confirmOpen.set(false)"
    ></ui-confirm-dialog>

    <ui-toast [toasts]="toasts()" (dismiss)="dismissToast($event)"></ui-toast>
  `
})
export class ModalsDemoComponent {
  readonly toasts = signal<ToastMessage[]>([]);
  readonly activeModalKind = signal<DemoModalKind>(null);
  readonly confirmOpen = signal(false);

  readonly fillerLines = Array.from({ length: 8 }, (_, index) => `Scrollable content line ${index + 1}.`);

  readonly confirmOptions: ConfirmDialogOptions = {
    title: 'Confirm Demo Action',
    message: 'This demonstrates the rebuilt confirm dialog with a required reason.',
    confirmText: 'Approve',
    cancelText: 'Dismiss',
    variant: 'warning',
    reasonRequired: true,
    reasonLabel: 'Approval Reason',
    reasonPlaceholder: 'Why are you approving this demo action?'
  };

  openModal(kind: Exclude<DemoModalKind, null>): void {
    this.activeModalKind.set(kind);
  }

  closeModal(): void {
    this.activeModalKind.set(null);
  }

  resolvedModalWidth(): 'thin' | 'normal' | 'wide' {
    return this.activeModalKind() ?? 'normal';
  }

  openConfirm(): void {
    this.confirmOpen.set(true);
  }

  confirmModalAction(): void {
    this.closeModal();
    this.pushToast('success', 'Modal action confirmed.');
  }

  handleConfirm(reason: string): void {
    const suffix = reason ? ` Reason: ${reason}` : '';
    this.pushToast('info', `Confirm dialog approved.${suffix}`);
  }

  clearToasts(): void {
    this.toasts.set([]);
  }

  dismissToast(id: string): void {
    this.toasts.update((items) => items.filter((toast) => toast.id !== id));
  }

  pushToast(type: ToastMessage['type'], message: string): void {
    const id = `modal-toast-${Date.now()}-${this.toasts().length}`;
    this.toasts.update((items) => [...items, { id, type, message }]);
  }
}
