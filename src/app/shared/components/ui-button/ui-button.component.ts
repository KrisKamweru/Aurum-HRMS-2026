import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-button',
  imports: [UiIconComponent],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="getClasses()"
      (click)="handleClick($event)"
    >
      @if (loading()) {
        <svg class="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      } @else if (icon()) {
        <ui-icon [name]="icon()!" class="h-4 w-4 drop-shadow-sm transition-transform group-hover:scale-110"></ui-icon>
      }
      <ng-content></ng-content>
    </button>
  `
})
export class UiButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly fullWidth = input(false);
  readonly customClass = input('');
  readonly prerequisitesMet = input(true);
  readonly icon = input<string>();

  readonly onClick = output<MouseEvent>();
  readonly blocked = output<void>();

  handleClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      return;
    }
    if (!this.prerequisitesMet()) {
      event.preventDefault();
      event.stopPropagation();
      this.blocked.emit(undefined);
      return;
    }
    this.onClick.emit(event);
  }

  getClasses(): string {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100';
    const width = this.fullWidth() ? 'w-full' : '';
    const state = this.disabled() || this.loading() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer';

    const sizeMap: Record<ButtonSize, string> = {
      sm: 'px-4 py-1.5 text-xs',
      md: 'px-6 py-2 text-sm',
      lg: 'px-8 py-3 text-base'
    };

    const variantMap: Record<ButtonVariant, string> = {
      primary: 'bg-primary-800 text-white hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 shadow-sm hover:shadow-md transition-colors',
      secondary: 'bg-[var(--color-bg-surface-elevated)] backdrop-blur-sm border border-black/5 dark:border-white/10 text-slate-800 hover:bg-[var(--color-bg-surface-hover)] dark:hover:bg-[var(--color-bg-surface-hover)] hover:text-slate-900 dark:bg-white/5 dark:text-white dark:hover:text-slate-900 transition-colors',
      danger: 'bg-danger text-white hover:bg-red-500 shadow-sm hover:shadow-md transition-colors',
      ghost: 'bg-transparent text-text-main hover:bg-[var(--color-bg-surface-elevated)] dark:text-white transition-colors',
      outline: 'border border-primary-800/30 bg-transparent text-primary-800 hover:border-primary-800 dark:border-primary-600/30 dark:text-primary-600 dark:hover:border-primary-600 transition-colors',
      gold: 'bg-accent text-white hover:bg-amber-400 shadow-sm hover:shadow-md transition-colors'
    };

    return `${base} ${sizeMap[this.size()]} ${variantMap[this.variant()]} ${width} ${state} ${this.customClass()}`.trim();
  }
}
