import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  actionLabel?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-toast',
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      @for (toast of toasts(); track toast.id) {
        <div class="pointer-events-auto flex w-full max-w-sm overflow-hidden rounded-2xl glass-surface shadow-lg ring-1 ring-black/5 dark:ring-white/10 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div class="w-1.5" [class]="dotClass(toast.type)"></div>
          <div class="flex flex-1 items-start justify-between p-4 bg-white/60 dark:bg-black/40">
            <div class="flex-1">
              <p class="text-[13px] font-medium text-slate-900 dark:text-slate-100">{{ toast.message }}</p>
              @if (toast.actionLabel) {
                <button type="button" class="mt-2 text-xs font-semibold text-primary-800 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 transition-colors" (click)="actionClick(toast.id)">{{ toast.actionLabel }}</button>
              }
            </div>
            <button type="button" class="ml-4 shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" (click)="dismissToast(toast.id)">
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class UiToastComponent {
  readonly toasts = input<ToastMessage[]>([]);

  readonly dismiss = output<string>();
  readonly action = output<string>();

  dismissToast(id: string): void {
    this.dismiss.emit(id);
  }

  actionClick(id: string): void {
    this.action.emit(id);
  }

  dotClass(type: ToastType): string {
    if (type === 'success') {
      return 'bg-emerald-500';
    }
    if (type === 'error') {
      return 'bg-red-500';
    }
    if (type === 'warning') {
      return 'bg-amber-500';
    }
    return 'bg-blue-500';
  }
}



