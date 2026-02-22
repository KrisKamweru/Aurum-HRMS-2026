import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, effect, inject, input, output } from '@angular/core';

export type ModalWidth = 'thin' | 'normal' | 'wide';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-modal',
  imports: [CommonModule],
  host: {
    class: 'contents',
    '(document:keydown.escape)': 'onEscape()'
  },
  template: `
    @if (isOpen()) {
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
              <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100">{{ title() }}</h3>
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

            @if (hasFooter()) {
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
export class UiModalComponent implements OnDestroy {
  readonly title = input('');
  readonly isOpen = input(false);
  readonly canDismiss = input(true);
  readonly hasFooter = input(false);
  readonly width = input<ModalWidth>('normal');

  readonly isOpenChange = output<boolean>();
  readonly close = output<void>();

  private readonly document = inject(DOCUMENT);
  private readonly bodyOverflowEffect = effect(() => {
    this.document.body.style.overflow = this.isOpen() ? 'hidden' : '';
  });

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  onEscape(): void {
    if (this.isOpen() && this.canDismiss()) {
      this.closeModal();
    }
  }

  handleBackdrop(): void {
    if (this.canDismiss()) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.isOpenChange.emit(false);
    this.close.emit(undefined);
  }

  getWidthClass(): string {
    const width = this.width();
    if (width === 'thin') {
      return 'sm:max-w-md';
    }
    if (width === 'wide') {
      return 'sm:max-w-5xl';
    }
    return 'sm:max-w-2xl';
  }
}


