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
    <ui-toast [toasts]="toasts()" (dismiss)="dismissToast($event)"></ui-toast>

    <div class="space-y-6">
      <header class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy-700 dark:text-burgundy-400">Demo</p>
        <h2 class="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">Modals, Confirm Dialogs & Toasts</h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          Showcases the rebuilt modal width presets (thin, normal, wide) and local toast interactions.
        </p>
      </header>

      <div class="grid gap-6 xl:grid-cols-2">
        <ui-card variant="glass" title="Toast Messages" subtitle="ui-toast with local page state">
          <div class="flex flex-wrap gap-3">
            <ui-button (onClick)="pushToast('success', 'Saved successfully.')">Success</ui-button>
            <ui-button variant="danger" (onClick)="pushToast('error', 'Something went wrong.')">Error</ui-button>
            <ui-button variant="secondary" (onClick)="pushToast('info', 'Background sync started.')">Info</ui-button>
            <ui-button variant="outline" (onClick)="pushToast('warning', 'Session expires soon.')">Warning</ui-button>
            <ui-button variant="ghost" (onClick)="clearToasts()">Clear</ui-button>
          </div>
        </ui-card>

        <ui-card variant="default" title="Overlay Components" subtitle="Modal widths + confirm dialog variants">
          <div class="flex flex-wrap gap-3">
            <ui-button (onClick)="openModal('thin')">Open Thin Modal</ui-button>
            <ui-button variant="secondary" (onClick)="openModal('normal')">Open Normal Modal</ui-button>
            <ui-button variant="outline" (onClick)="openModal('wide')">Open Wide Modal</ui-button>
            <ui-button variant="danger" (onClick)="openConfirm()">Open Confirm Dialog</ui-button>
          </div>
        </ui-card>
      </div>
    </div>

    <ui-modal
      [isOpen]="activeModalKind() !== null"
      title="Demo Modal"
      [width]="resolvedModalWidth()"
      [hasFooter]="true"
      (close)="closeModal()"
    >
      <div class="space-y-4 text-sm text-stone-700 dark:text-stone-300">
        <p>
          Current width preset:
          <span class="font-semibold text-stone-900 dark:text-stone-100">{{ activeModalKind() ?? 'normal' }}</span>
        </p>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="rounded-xl border border-stone-200 bg-white/70 p-4 dark:border-white/8 dark:bg-white/[0.03]">
            <h4 class="text-sm font-semibold text-stone-900 dark:text-stone-100">Internal Scroll Body</h4>
            <p class="mt-2 text-xs leading-5 text-stone-600 dark:text-stone-400">
              This modal body scrolls internally when content grows, matching the rebuild's overflow containment rules.
            </p>
          </div>
          <div class="rounded-xl border border-stone-200 bg-white/70 p-4 dark:border-white/8 dark:bg-white/[0.03]">
            <h4 class="text-sm font-semibold text-stone-900 dark:text-stone-100">Width Presets</h4>
            <ul class="mt-2 space-y-1 text-xs leading-5 text-stone-600 dark:text-stone-400">
              <li>thin = compact confirm/edit flows</li>
              <li>normal = standard forms (default)</li>
              <li>wide = dense tables / multi-column forms</li>
            </ul>
          </div>
        </div>

        <div class="space-y-2">
          @for (line of fillerLines; track line) {
            <p class="text-xs leading-5 text-stone-500 dark:text-stone-400">{{ line }}</p>
          }
        </div>
      </div>

      <div footer class="flex justify-end gap-3">
        <ui-button variant="outline" (onClick)="closeModal()">Cancel</ui-button>
        <ui-button (onClick)="confirmModalAction()">Confirm</ui-button>
      </div>
    </ui-modal>

    <ui-confirm-dialog
      [isOpen]="confirmOpen()"
      [options]="confirmOptions"
      (isOpenChange)="confirmOpen.set($event)"
      (confirm)="handleConfirm($event)"
    />
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
