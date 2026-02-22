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
  template: ''
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


