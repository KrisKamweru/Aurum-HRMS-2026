import { Component, computed, inject } from '@angular/core';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'ui-confirm-dialog',
  host: {
    class: 'contents'
  },
  imports: [UiIconComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          (click)="onCancel()"
        ></div>

        <div class="relative z-10 flex min-h-full items-center justify-center p-4">
          <!-- Dialog -->
          <div class="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl dark:border-white/8 dark:bg-white/5 dark:backdrop-blur-xl animate-scale-in">
            <div class="overflow-y-auto p-6">
              <!-- Icon based on variant -->
              <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full" [class]="getIconBgClass()">
                <ui-icon [name]="getIconName()" class="w-6 h-6" [class]="getIconColorClass()"></ui-icon>
              </div>

              <!-- Title -->
              <h3 class="text-lg font-semibold text-center text-stone-900 dark:text-stone-100 mb-2">
                {{ options()?.title }}
              </h3>

              <!-- Message -->
              <p class="text-sm text-center text-stone-600 dark:text-stone-400 mb-6">
                {{ options()?.message }}
              </p>

              @if (options()?.details?.length) {
                <div class="mb-6 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/40 p-3 text-left">
                  @if (options()?.impactLabel) {
                    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                      {{ options()?.impactLabel }}
                    </p>
                  }
                  <ul class="space-y-1 text-xs text-stone-700 dark:text-stone-300">
                    @for (item of options()?.details || []; track $index) {
                      <li>{{ item }}</li>
                    }
                  </ul>
                </div>
              }

              @if (options()?.reasonRequired) {
                <div class="mb-6 text-left">
                  <label for="confirm-reason" class="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                    {{ options()?.reasonLabel || 'Reason' }}
                  </label>
                  <textarea
                    id="confirm-reason"
                    [value]="reason()"
                    (input)="onReasonInput($event)"
                    rows="3"
                    class="block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                    [placeholder]="options()?.reasonPlaceholder || 'Enter a reason'"
                  ></textarea>
                </div>
              }

              <!-- Buttons -->
              <div class="flex gap-3 justify-end">
                <button
                  type="button"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400"
                  (click)="onCancel()"
                >
                  {{ options()?.cancelText }}
                </button>
                <button
                  type="button"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  [class]="getConfirmButtonClass()"
                  [disabled]="confirmDisabled()"
                  [class.opacity-50]="confirmDisabled()"
                  [class.cursor-not-allowed]="confirmDisabled()"
                  (click)="onConfirm()"
                >
                  {{ options()?.confirmText }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class UiConfirmDialogComponent {
  private confirmDialogService = inject(ConfirmDialogService);

  protected isOpen = computed(() => this.confirmDialogService.dialogState().isOpen);
  protected options = computed(() => this.confirmDialogService.dialogState().options);
  protected reason = computed(() => this.confirmDialogService.dialogState().reason);
  protected confirmDisabled = computed(() => {
    if (!this.options()?.reasonRequired) return false;
    return !this.reason().trim();
  });

  protected onConfirm(): void {
    if (this.confirmDisabled()) return;
    this.confirmDialogService.handleResponse(true);
  }

  protected onCancel(): void {
    this.confirmDialogService.handleResponse(false);
  }

  protected onReasonInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.confirmDialogService.setReason(target?.value || '');
  }

  protected getIconName(): string {
    const variant = this.options()?.variant || 'info';
    switch (variant) {
      case 'danger':
        return 'exclamation-triangle';
      case 'warning':
        return 'exclamation-circle';
      case 'info':
      default:
        return 'information-circle';
    }
  }

  protected getIconBgClass(): string {
    const variant = this.options()?.variant || 'info';
    switch (variant) {
      case 'danger':
        return 'bg-red-100 dark:bg-red-900/20';
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-900/20';
      case 'info':
      default:
        return 'bg-burgundy-100 dark:bg-burgundy-900/20';
    }
  }

  protected getIconColorClass(): string {
    const variant = this.options()?.variant || 'info';
    switch (variant) {
      case 'danger':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'info':
      default:
        return 'text-burgundy-600 dark:text-burgundy-400';
    }
  }

  protected getConfirmButtonClass(): string {
    const variant = this.options()?.variant || 'info';
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-400';
      case 'info':
      default:
        return 'bg-burgundy-600 hover:bg-burgundy-700 focus-visible:ring-burgundy-500';
    }
  }
}
