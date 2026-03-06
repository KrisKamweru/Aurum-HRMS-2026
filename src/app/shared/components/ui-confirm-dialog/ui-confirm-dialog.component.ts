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
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div class="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-300" (click)="dismiss()"></div>
        
        <div class="relative w-full max-w-sm flex flex-col overflow-hidden rounded-[24px] glass-surface transition-all animate-in zoom-in-95 duration-300">
          <!-- Header Area -->
          <div class="px-6 pt-6 pb-4 flex flex-col items-center text-center">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mb-4 {{ iconBgClass() }}">
              <ui-icon [name]="iconName()" class="w-6 h-6 {{ iconColorClass() }}"></ui-icon>
            </div>
            
            <h3 class="text-xl font-display font-semibold text-slate-900 dark:text-white leading-tight">
              {{ options().title }}
            </h3>
            <p class="mt-2 text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-body">
              {{ options().message }}
            </p>
          </div>

          <!-- Reason Input (if required) -->
          @if (options().reasonRequired) {
            <div class="px-6 pb-6 w-full animate-in slide-in-from-top-2 duration-300">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 pl-1">{{ options().reasonLabel || 'Reason required' }} <span class="text-red-500">*</span></label>
              <input
                type="text"
                [(ngModel)]="reason"
                class="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                [placeholder]="options().reasonPlaceholder || 'Type your reason here...'"
              />
            </div>
          }

          <!-- Actions -->
          <div class="p-6 pt-2 flex flex-col gap-3 w-full">
            <button 
              type="button" 
              class="w-full py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900" 
              [class]="confirmButtonClass()"
              [disabled]="isConfirmDisabled()"
              (click)="confirmAction()"
            >
              {{ options().confirmText || 'Confirm' }}
            </button>
            <button 
              type="button" 
              class="w-full py-2.5 rounded-full font-semibold text-sm transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-white/10" 
              (click)="dismiss()"
            >
              {{ options().cancelText || 'Cancel' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
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
    return 'bg-primary-100 dark:bg-primary-900/20';
  }

  iconColorClass(): string {
    if (this.options().variant === 'danger') {
      return 'text-red-600 dark:text-red-400';
    }
    if (this.options().variant === 'warning') {
      return 'text-amber-600 dark:text-amber-400';
    }
    return 'text-primary-700 dark:text-primary-300';
  }

  confirmButtonClass(): string {
    if (this.options().variant === 'danger') {
      return 'bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed';
    }
    if (this.options().variant === 'warning') {
      return 'bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed';
    }
    return 'bg-primary-700 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed';
  }
}



