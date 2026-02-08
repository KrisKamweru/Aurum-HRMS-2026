import { Component, computed, inject } from '@angular/core';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'ui-confirm-dialog',
  imports: [UiIconComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 animate-fade-in"
          (click)="onCancel()"
        ></div>

        <!-- Dialog -->
        <div class="relative bg-white dark:bg-stone-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-modal-in">
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
              (click)="onConfirm()"
            >
              {{ options()?.confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }

    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }

    .animate-modal-in {
      animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `]
})
export class UiConfirmDialogComponent {
  private confirmDialogService = inject(ConfirmDialogService);

  protected isOpen = computed(() => this.confirmDialogService.dialogState().isOpen);
  protected options = computed(() => this.confirmDialogService.dialogState().options);

  protected onConfirm(): void {
    this.confirmDialogService.handleResponse(true);
  }

  protected onCancel(): void {
    this.confirmDialogService.handleResponse(false);
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
