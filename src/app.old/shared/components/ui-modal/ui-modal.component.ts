import { Component, Input, Output, EventEmitter, HostListener, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'ui-modal',
  standalone: true,
  host: {
    class: 'contents'
  },
  imports: [CommonModule, UiIconComponent],
  template: `
    @if (isOpenSignal()) {
      <div
        class="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          aria-hidden="true"
          (click)="handleBackdropClick()"
        ></div>

        <div class="fixed inset-0 flex items-end sm:items-center justify-center p-4 sm:p-6 text-center pointer-events-none">
          <!-- Modal Panel -->
          <div
            class="pointer-events-auto relative flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-2xl transition-all dark:border-white/8 dark:bg-white/5 dark:backdrop-blur-xl animate-scale-in"
            [class]="getSizeClasses()"
            (click)="$event.stopPropagation()"
          >
            <!-- Decorative top gradient -->
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-burgundy-800 via-burgundy-700 to-burgundy-800 dark:from-burgundy-600 dark:via-burgundy-500 dark:to-burgundy-600"></div>

            <!-- Header -->
            <div class="bg-white dark:bg-white/5 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-stone-100 dark:border-white/5">
              <div class="flex items-center justify-between">
                <h3
                  class="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-100"
                  id="modal-title"
                >
                  {{ title }}
                </h3>
                <button
                  type="button"
                  class="rounded-lg p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-500 transition-all duration-200"
                  (click)="closeModal()"
                >
                  <span class="sr-only">Close</span>
                  <ui-icon name="x-mark" class="h-5 w-5"></ui-icon>
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto text-stone-700 dark:text-stone-300">
              <ng-content></ng-content>
            </div>

            <!-- Footer -->
            @if (hasFooter) {
              <div class="bg-stone-50 dark:bg-white/5 px-4 sm:px-6 py-3 sm:py-4 border-t border-stone-100 dark:border-white/5 flex flex-row-reverse gap-3">
                <ng-content select="[footer]"></ng-content>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
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
