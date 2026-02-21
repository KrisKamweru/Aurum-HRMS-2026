import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject } from '@angular/core';

export type ModalWidth = 'thin' | 'normal' | 'wide';

@Component({
  selector: 'ui-modal',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'contents'
  },
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-[1000] overflow-hidden overscroll-contain" role="dialog" aria-modal="true">
        <button
          type="button"
          aria-label="Close modal backdrop"
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          (click)="handleBackdrop()"
        ></button>

        <div class="pointer-events-none absolute inset-0 flex items-center justify-center p-4 sm:p-6">
          <section
            class="pointer-events-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-white/[0.55] bg-white/[0.72] shadow-lg backdrop-blur-xl dark:border-white/8 dark:bg-white/5 dark:shadow-none dark:backdrop-blur-xl"
            [class]="getWidthClass()"
          >
            <header class="flex items-center justify-between border-b border-stone-200/80 px-5 py-4 dark:border-white/8">
              <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100">{{ title }}</h3>
              <button
                type="button"
                class="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100 dark:border-white/8 dark:text-stone-300 dark:hover:bg-white/10"
                (click)="closeModal()"
              >
                Close
              </button>
            </header>

            <div data-testid="modal-body" class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              <ng-content></ng-content>
            </div>

            @if (hasFooter) {
              <footer class="border-t border-stone-200/80 px-5 py-4 dark:border-white/8">
                <ng-content select="[footer]"></ng-content>
              </footer>
            }
          </section>
        </div>
      </div>
    }
  `
})
export class UiModalComponent implements OnChanges, OnDestroy {
  @Input() title = '';
  @Input() isOpen = false;
  @Input() canDismiss = true;
  @Input() hasFooter = false;
  @Input() width: ModalWidth = 'normal';

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  private readonly document = inject(DOCUMENT);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      this.document.body.style.overflow = this.isOpen ? 'hidden' : '';
    }
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen && this.canDismiss) {
      this.closeModal();
    }
  }

  handleBackdrop(): void {
    if (this.canDismiss) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.close.emit();
  }

  getWidthClass(): string {
    if (this.width === 'thin') {
      return 'sm:max-w-md';
    }
    if (this.width === 'wide') {
      return 'sm:max-w-5xl';
    }
    return 'sm:max-w-2xl';
  }
}
