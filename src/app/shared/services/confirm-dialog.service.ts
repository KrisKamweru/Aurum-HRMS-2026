import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;  // default: "Confirm"
  cancelText?: string;   // default: "Cancel"
  variant?: 'danger' | 'warning' | 'info';  // default: 'info'
}

interface DialogState {
  isOpen: boolean;
  options: ConfirmDialogOptions | null;
  resolve: ((value: boolean) => void) | null;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private state = signal<DialogState>({
    isOpen: false,
    options: null,
    resolve: null
  });

  readonly dialogState = this.state.asReadonly();

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({
        isOpen: true,
        options: {
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          variant: 'info',
          ...options
        },
        resolve
      });
    });
  }

  handleResponse(confirmed: boolean): void {
    const current = this.state();
    if (current.resolve) {
      current.resolve(confirmed);
    }
    this.state.set({ isOpen: false, options: null, resolve: null });
  }
}
