import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-button',
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="getClasses()"
      (click)="handleClick($event)"
    >
      @if (loading()) {
        <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
      }
      <span><ng-content></ng-content></span>
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
      'inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-500';
    const width = this.fullWidth() ? 'w-full' : '';
    const state = this.disabled() || this.loading() ? 'cursor-not-allowed opacity-60' : 'cursor-pointer';

    const sizeMap: Record<ButtonSize, string> = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-sm'
    };

    const variantMap: Record<ButtonVariant, string> = {
      primary: 'bg-burgundy-700 text-white hover:bg-burgundy-600',
      secondary:
        'border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 dark:border-white/8 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      ghost: 'bg-transparent text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/10',
      outline: 'border border-stone-300 bg-transparent text-stone-700 hover:border-burgundy-400 dark:border-white/15 dark:text-stone-300',
      gold: 'bg-amber-400 text-amber-950 hover:bg-amber-500'
    };

    return `${base} ${sizeMap[this.size()]} ${variantMap[this.variant()]} ${width} ${state} ${this.customClass()}`.trim();
  }
}



