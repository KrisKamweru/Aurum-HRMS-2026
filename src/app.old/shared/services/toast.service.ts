import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    link: any[]; // Router link array
  };
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<Toast[]>([]);

  // Public readonly signal for components to consume
  readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, type: ToastType = 'info', duration = 3000, action?: { label: string, link: any[] }) {
    const id = crypto.randomUUID();
    const toast: Toast = { id, message, type, duration, action };

    this.toastsSignal.update(toasts => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  success(message: string, duration = 3000, action?: { label: string, link: any[] }) {
    this.show(message, 'success', duration, action);
  }

  error(message: string, duration = 5000, action?: { label: string, link: any[] }) {
    this.show(message, 'error', duration, action);
  }

  info(message: string, duration = 3000, action?: { label: string, link: any[] }) {
    this.show(message, 'info', duration, action);
  }

  warning(message: string, duration = 4000, action?: { label: string, link: any[] }) {
    this.show(message, 'warning', duration, action);
  }

  remove(id: string) {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }
}
