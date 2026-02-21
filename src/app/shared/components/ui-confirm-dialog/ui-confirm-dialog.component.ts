import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

export type ConfirmVariant = 'info' | 'warning' | 'danger';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  reasonRequired?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
}

@Component({
  selector: 'ui-confirm-dialog',
  standalone: true,
  imports: [FormsModule, UiIconComponent],
  host: { class: 'contents' },
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-[1100] overflow-hidden">
        <button type="button" class="absolute inset-0 bg-black/40 backdrop-blur-sm" (click)="dismiss()"></button>

        <div class="relative flex min-h-full items-center justify-center p-4">
          <section class="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.55] bg-white/[0.72] shadow-lg backdrop-blur-xl dark:border-white/8 dark:bg-white/5 dark:backdrop-blur-xl">
            <div class="space-y-4 p-6">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full" [class]="iconBgClass()">
                <ui-icon [name]="iconName()" class="h-6 w-6" [class]="iconColorClass()"></ui-icon>
              </div>

              <div class="space-y-1 text-center">
                <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100">{{ options.title }}</h3>
                <p class="text-sm text-stone-600 dark:text-stone-400">{{ options.message }}</p>
              </div>

              @if (options.reasonRequired) {
                <div class="space-y-1 text-left">
                  <label for="confirm-reason" class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">{{ options.reasonLabel || 'Reason' }}</label>
                  <textarea
                    id="confirm-reason"
                    [(ngModel)]="reason"
                    rows="3"
                    class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100"
                    [placeholder]="options.reasonPlaceholder || 'Enter a reason'"
                  ></textarea>
                </div>
              }

              <div class="flex justify-end gap-3">
                <button type="button" class="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:border-white/8 dark:text-stone-200 dark:hover:bg-white/10" (click)="dismiss()">{{ options.cancelText || 'Cancel' }}</button>
                <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-white" [class]="confirmButtonClass()" [disabled]="isConfirmDisabled()" (click)="confirmAction()">{{ options.confirmText || 'Confirm' }}</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    }
  `
})
export class UiConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() options: ConfirmDialogOptions = {
    title: 'Confirm Action',
    message: 'Are you sure you want to continue?'
  };

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  reason = '';

  dismiss(): void {
    this.reason = '';
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.cancel.emit();
  }

  confirmAction(): void {
    if (this.isConfirmDisabled()) {
      return;
    }
    this.confirm.emit(this.reason.trim());
    this.reason = '';
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }

  isConfirmDisabled(): boolean {
    return !!this.options.reasonRequired && this.reason.trim().length === 0;
  }

  iconName(): string {
    if (this.options.variant === 'danger') {
      return 'exclamation-triangle';
    }
    return 'information-circle';
  }

  iconBgClass(): string {
    if (this.options.variant === 'danger') {
      return 'bg-red-100 dark:bg-red-900/20';
    }
    if (this.options.variant === 'warning') {
      return 'bg-amber-100 dark:bg-amber-900/20';
    }
    return 'bg-burgundy-100 dark:bg-burgundy-900/20';
  }

  iconColorClass(): string {
    if (this.options.variant === 'danger') {
      return 'text-red-600 dark:text-red-400';
    }
    if (this.options.variant === 'warning') {
      return 'text-amber-600 dark:text-amber-400';
    }
    return 'text-burgundy-700 dark:text-burgundy-300';
  }

  confirmButtonClass(): string {
    if (this.options.variant === 'danger') {
      return 'bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed';
    }
    if (this.options.variant === 'warning') {
      return 'bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed';
    }
    return 'bg-burgundy-700 hover:bg-burgundy-600 disabled:opacity-50 disabled:cursor-not-allowed';
  }
}

