import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  actionLabel?: string;
}

@Component({
  selector: 'ui-toast',
  standalone: true,
  template: `
    <div class="pointer-events-none fixed right-4 top-4 z-[1200] flex w-full max-w-sm flex-col gap-2">
      @for (toast of toasts; track toast.id) {
        <article class="pointer-events-auto rounded-xl border border-white/[0.55] bg-white/[0.82] p-4 shadow-lg backdrop-blur-xl dark:border-white/8 dark:bg-white/10">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 h-2.5 w-2.5 rounded-full" [class]="dotClass(toast.type)"></span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-stone-900 dark:text-stone-100">{{ toast.message }}</p>
              @if (toast.actionLabel) {
                <button type="button" class="mt-2 text-xs font-semibold text-burgundy-700 hover:text-burgundy-600 dark:text-burgundy-300" (click)="actionClick(toast.id)">{{ toast.actionLabel }}</button>
              }
            </div>
            <button type="button" class="text-xs font-semibold text-stone-500 hover:text-stone-700 dark:text-stone-300" (click)="dismissToast(toast.id)">Close</button>
          </div>
        </article>
      }
    </div>
  `
})
export class UiToastComponent {
  @Input() toasts: ToastMessage[] = [];

  @Output() dismiss = new EventEmitter<string>();
  @Output() action = new EventEmitter<string>();

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

