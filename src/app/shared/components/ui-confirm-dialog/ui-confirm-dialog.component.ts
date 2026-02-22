import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-confirm-dialog',
  imports: [FormsModule, UiIconComponent],
  host: { class: 'contents' },
  template: ''
})
export class UiConfirmDialogComponent {
  readonly isOpen = input(false);
  readonly options = input<ConfirmDialogOptions>({
    title: 'Confirm Action',
    message: 'Are you sure you want to continue?'
  });

  readonly isOpenChange = output<boolean>();
  readonly confirm = output<string>();
  readonly cancel = output<void>();

  reason = '';

  dismiss(): void {
    this.reason = '';
    this.isOpenChange.emit(false);
    this.cancel.emit(undefined);
  }

  confirmAction(): void {
    if (this.isConfirmDisabled()) {
      return;
    }
    this.confirm.emit(this.reason.trim());
    this.reason = '';
    this.isOpenChange.emit(false);
  }

  isConfirmDisabled(): boolean {
    return !!this.options().reasonRequired && this.reason.trim().length === 0;
  }

  iconName(): string {
    if (this.options().variant === 'danger') {
      return 'exclamation-triangle';
    }
    return 'information-circle';
  }

  iconBgClass(): string {
    if (this.options().variant === 'danger') {
      return 'bg-red-100 dark:bg-red-900/20';
    }
    if (this.options().variant === 'warning') {
      return 'bg-amber-100 dark:bg-amber-900/20';
    }
    return 'bg-burgundy-100 dark:bg-burgundy-900/20';
  }

  iconColorClass(): string {
    if (this.options().variant === 'danger') {
      return 'text-red-600 dark:text-red-400';
    }
    if (this.options().variant === 'warning') {
      return 'text-amber-600 dark:text-amber-400';
    }
    return 'text-burgundy-700 dark:text-burgundy-300';
  }

  confirmButtonClass(): string {
    if (this.options().variant === 'danger') {
      return 'bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed';
    }
    if (this.options().variant === 'warning') {
      return 'bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed';
    }
    return 'bg-burgundy-700 hover:bg-burgundy-600 disabled:opacity-50 disabled:cursor-not-allowed';
  }
}



