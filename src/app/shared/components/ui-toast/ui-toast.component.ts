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
  template: ''
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



