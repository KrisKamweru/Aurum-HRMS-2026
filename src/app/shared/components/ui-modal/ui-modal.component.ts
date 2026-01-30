import { Component, Input, Output, EventEmitter, HostListener, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'ui-modal',
  standalone: true,
  imports: [CommonModule, UiIconComponent],
  template: `
    @if (isOpenSignal()) {
      <div
        class="modal-container"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div
          class="modal-backdrop animate-fade-in"
          aria-hidden="true"
          (click)="handleBackdropClick()"
        ></div>

        <div class="modal-content-wrapper">
          <!-- Modal Panel -->
          <div
            class="relative transform overflow-hidden rounded-2xl bg-white dark:bg-stone-800 text-left shadow-2xl transition-all sm:my-8 w-full animate-modal-in"
            [class]="getSizeClasses()"
            (click)="$event.stopPropagation()"
          >
            <!-- Decorative top gradient -->
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-burgundy-800 via-burgundy-700 to-burgundy-800 dark:from-burgundy-600 dark:via-burgundy-500 dark:to-burgundy-600"></div>

            <!-- Header -->
            <div class="bg-white dark:bg-stone-800 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-stone-100 dark:border-stone-700">
              <div class="flex items-center justify-between">
                <h3
                  class="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-100"
                  id="modal-title"
                >
                  {{ title }}
                </h3>
                <button
                  type="button"
                  class="rounded-lg p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-800 transition-all duration-200"
                  (click)="closeModal()"
                >
                  <span class="sr-only">Close</span>
                  <ui-icon name="x-mark" class="h-5 w-5"></ui-icon>
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="px-4 sm:px-6 py-4 sm:py-6 max-h-[75vh] sm:max-h-[60vh] overflow-y-auto text-stone-700 dark:text-stone-300">
              <ng-content></ng-content>
            </div>

            <!-- Footer -->
            @if (hasFooter) {
              <div class="bg-stone-50 dark:bg-stone-900/50 px-4 sm:px-6 py-3 sm:py-4 border-t border-stone-100 dark:border-stone-700 flex flex-row-reverse gap-3">
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

    .modal-container {
      position: fixed;
      inset: 0;
      z-index: 9999;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(28, 25, 23, 0.6);
      backdrop-filter: blur(4px);
    }

    .modal-content-wrapper {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 1rem;
      text-align: center;
      pointer-events: none;
    }

    .modal-content-wrapper > * {
      pointer-events: auto;
    }

    @media (min-width: 640px) {
      .modal-content-wrapper {
        align-items: center;
        padding: 0;
      }
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
export class UiModalComponent implements OnDestroy {
  @Input() title = '';
  @Input() size: ModalSize = 'md';
  @Input() canDismiss = true;
  @Input() hasFooter = true;

  private document = inject(DOCUMENT);

  @Input() set isOpen(value: boolean) {
    this.isOpenSignal.set(value);
    if (value) {
      this.document.body.style.overflow = 'hidden';
    } else {
      this.document.body.style.overflow = '';
    }
  }

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  protected isOpenSignal = signal(false);

  ngOnDestroy() {
    this.document.body.style.overflow = '';
  }

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
    this.document.body.style.overflow = '';
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
