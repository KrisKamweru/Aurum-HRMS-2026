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
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sm:pb-20">
        <div class="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" (click)="handleBackdrop()"></div>
        <div 
          class="relative flex max-h-[90vh] flex-col overflow-hidden rounded-3xl glass-surface shadow-2xl transition-all animate-in zoom-in-95 duration-300 w-full"
          [class]="getWidthClass()"
          role="dialog"
          aria-modal="true"
        >
          @if (title()) {
            <div class="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-white/5 bg-transparent">
              <h3 class="text-xl font-display font-medium text-slate-900 dark:text-white">{{ title() }}</h3>
              @if (canDismiss()) {
                <button type="button" class="rounded-full p-2 text-slate-400 hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200 transition-colors" (click)="closeModal()">
                  <span class="sr-only">Close</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                </button>
              }
            </div>
          }
          <div class="flex-1 overflow-y-auto p-6 scrollbar-custom bg-transparent">
            <ng-content></ng-content>
          </div>
          @if (hasFooter()) {
            <div class="px-6 py-4 border-t border-black/5 dark:border-white/5 bg-transparent flex flex-row-reverse gap-3">
              <ng-content select="[footer]"></ng-content>
            </div>
          }
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


