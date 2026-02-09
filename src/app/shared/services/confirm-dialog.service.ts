import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;  // default: "Confirm"
  cancelText?: string;   // default: "Cancel"
  variant?: 'danger' | 'warning' | 'info';  // default: 'info'
  impactLabel?: string;
  details?: string[];
  reasonRequired?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
}

interface DialogState {
  isOpen: boolean;
  options: ConfirmDialogOptions | null;
  resolve: ((value: { confirmed: boolean; reason: string }) => void) | null;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private state = signal<DialogState>({
    isOpen: false,
    options: null,
    resolve: null,
    reason: '',
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
          ...options,
          reasonRequired: false,
        },
        reason: '',
        resolve: (value) => resolve(value.confirmed),
      });
    });
  }

  confirmWithReason(options: ConfirmDialogOptions): Promise<string | null> {
    return new Promise((resolve) => {
      this.state.set({
        isOpen: true,
        options: {
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          variant: 'warning',
          reasonLabel: 'Reason',
          reasonPlaceholder: 'Provide a clear justification',
          ...options,
          reasonRequired: true,
        },
        reason: '',
        resolve: (value) => resolve(value.confirmed ? value.reason : null),
      });
    });
  }

  setReason(reason: string): void {
    const current = this.state();
    if (!current.isOpen) return;
    this.state.set({ ...current, reason });
  }

  handleResponse(confirmed: boolean): void {
    const current = this.state();
    if (current.resolve) {
      current.resolve({ confirmed, reason: current.reason.trim() });
    }
    this.state.set({ isOpen: false, options: null, resolve: null, reason: '' });
  }
}
