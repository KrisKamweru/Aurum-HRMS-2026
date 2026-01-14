import { Component, Input, Output, EventEmitter, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'ui-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpenSignal()) {
      <div
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300"
          [class.animate-fade-in]="isOpenSignal()"
          aria-hidden="true"
          (click)="handleBackdropClick()"
        ></div>

        <div class="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <!-- Modal Panel -->
          <div
            class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full animate-modal-in"
            [class]="getSizeClasses()"
          >
            <!-- Decorative top gradient -->
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8b1e3f] via-[#a82349] to-[#8b1e3f]"></div>

            <!-- Header -->
            <div class="bg-white px-6 pt-6 pb-4 border-b border-stone-100">
              <div class="flex items-center justify-between">
                <h3
                  class="text-xl font-semibold text-stone-900"
                  id="modal-title"
                >
                  {{ title }}
                </h3>
                <button
                  type="button"
                  class="rounded-lg p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b1e3f] transition-all duration-200"
                  (click)="closeModal()"
                >
                  <span class="sr-only">Close</span>
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="px-6 py-6 max-h-[60vh] overflow-y-auto">
              <ng-content></ng-content>
            </div>

            <!-- Footer -->
            @if (hasFooter) {
              <div class="bg-stone-50 px-6 py-4 border-t border-stone-100 flex flex-row-reverse gap-3">
                <ng-content select="[footer]"></ng-content>
              </div>
            }
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
export class UiModalComponent {
  @Input() title = '';
  @Input() size: ModalSize = 'md';
  @Input() canDismiss = true;
  @Input() hasFooter = true;

  @Input() set isOpen(value: boolean) {
    this.isOpenSignal.set(value);
    if (value) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  protected isOpenSignal = signal(false);

  handleBackdropClick() {
    if (this.canDismiss) {
      this.closeModal();
    }
  }

  @HostListener('document:keydown.escape')
  onKeydownHandler() {
    if (this.isOpenSignal() && this.canDismiss) {
      this.closeModal();
    }
  }

  closeModal() {
    this.isOpenSignal.set(false);
    this.isOpenChange.emit(false);
    this.close.emit();
    document.body.style.overflow = '';
  }

  getSizeClasses(): string {
    const sizes = {
      sm: 'sm:max-w-sm',
      md: 'sm:max-w-lg',
      lg: 'sm:max-w-2xl',
      xl: 'sm:max-w-4xl',
      full: 'sm:max-w-[90vw] sm:m-4'
    };
    return sizes[this.size];
  }
}
