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
  template: ''
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
