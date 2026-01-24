import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="getClasses()"
      (click)="handleClick($event)"
    >
      <!-- Shimmer effect on hover for primary -->
      <div class="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div class="relative flex items-center justify-center gap-2">
        <svg *ngIf="loading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <ng-content></ng-content>
      </div>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .shimmer-effect {
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.15) 50%,
        transparent 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class UiButtonComponent {
  private toastService = inject(ToastService);

  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Input() customClass = '';

  // Prerequisite inputs
  @Input() prerequisitesMet = true;
  @Input() prerequisiteMessage = 'Action unavailable due to missing prerequisites.';
  @Input() prerequisiteAction?: { label: string, link: any[] };

  @Output() onClick = new EventEmitter<MouseEvent>();

  handleClick(event: MouseEvent) {
    if (!this.prerequisitesMet && !this.disabled && !this.loading) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.toastService.warning(
        this.prerequisiteMessage,
        5000,
        this.prerequisiteAction
      );
      return;
    }
    this.onClick.emit(event);
  }

  getClasses(): string {
    const baseClasses = `
      group relative inline-flex items-center justify-center
      font-semibold rounded-xl
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      transform transition-all duration-200 ease-out
      active:scale-[0.98]
      overflow-hidden
    `;

    const sizeClasses = {
      sm: 'px-4 py-2 text-xs tracking-wide',
      md: 'px-5 py-2.5 text-sm tracking-wide',
      lg: 'px-7 py-3.5 text-base tracking-wide'
    };

    const variantClasses = {
      primary: `
        text-white
        bg-gradient-to-br from-[#8b1e3f] to-[#722038]
        hover:from-[#a82349] hover:to-[#8b1e3f]
        hover:shadow-lg hover:shadow-[#8b1e3f]/25
        focus-visible:ring-[#8b1e3f]
        disabled:from-[#c92d5b]/50 disabled:to-[#a82349]/50
        border border-[#722038]/20
      `,
      secondary: `
        text-[#8b1e3f] dark:text-[#fce7eb]
        bg-gradient-to-br from-[#fdf2f4] to-[#fce7eb]
        dark:from-[#8b1e3f]/20 dark:to-[#722038]/20
        hover:from-[#fce7eb] hover:to-[#f9d0da]
        dark:hover:from-[#8b1e3f]/30 dark:hover:to-[#722038]/30
        hover:shadow-md hover:shadow-[#8b1e3f]/10
        focus-visible:ring-[#8b1e3f]
        disabled:opacity-50
        border border-[#f9d0da] dark:border-[#8b1e3f]/30
      `,
      danger: `
        text-white
        bg-gradient-to-br from-red-600 to-red-700
        hover:from-red-500 hover:to-red-600
        hover:shadow-lg hover:shadow-red-500/25
        focus-visible:ring-red-500
        disabled:from-red-400 disabled:to-red-500
        border border-red-700/20
      `,
      ghost: `
        text-stone-700 dark:text-stone-300
        bg-transparent
        hover:bg-stone-100 dark:hover:bg-stone-800
        hover:text-[#8b1e3f] dark:hover:text-[#fce7eb]
        focus-visible:ring-stone-400
        disabled:text-stone-400 disabled:hover:bg-transparent
      `,
      outline: `
        text-stone-700 dark:text-stone-300
        bg-white dark:bg-transparent
        border-2 border-stone-200 dark:border-stone-700
        hover:border-[#8b1e3f] hover:text-[#8b1e3f]
        dark:hover:border-[#8b1e3f] dark:hover:text-[#fce7eb]
        hover:shadow-md
        focus-visible:ring-[#8b1e3f]
        disabled:border-stone-100 disabled:text-stone-400
        dark:disabled:border-stone-800 dark:disabled:text-stone-600
      `,
      gold: `
        text-[#4a0d1f]
        bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500
        hover:from-amber-400 hover:via-amber-500 hover:to-amber-600
        hover:shadow-lg hover:shadow-amber-400/30
        focus-visible:ring-amber-500
        disabled:from-amber-200 disabled:to-amber-300
        border border-amber-500/20
      `
    };

    const widthClass = this.fullWidth ? 'w-full' : '';

    // If prerequisites are not met (and not explicitly disabled), show as disabled style but with not-allowed cursor
    // This invites the user to click it to see why (via logic in handleClick)
    const isDisabledStyle = this.disabled || this.loading || !this.prerequisitesMet;

    const stateClasses = isDisabledStyle
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer';

    return `
      ${baseClasses}
      ${sizeClasses[this.size]}
      ${variantClasses[this.variant]}
      ${widthClass}
      ${stateClasses}
      ${this.customClass}
    `.replace(/\s+/g, ' ').trim();
  }
}
