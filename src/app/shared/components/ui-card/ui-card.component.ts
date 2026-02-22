import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CardVariant = 'default' | 'premium' | 'glass' | 'outlined';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-card',
  template: ''
})
export class UiCardComponent {
  readonly title = input<string>();
  readonly subtitle = input<string>();
  readonly padding = input<CardPadding>('md');
  readonly variant = input<CardVariant>('default');
  readonly accent = input<string>();
  readonly hasHeaderActions = input(false);
  readonly hasFooter = input(false);

  getContainerClasses(): string {
    const base = 'relative flex h-full flex-col overflow-hidden rounded-2xl transition-all';
    const variants: Record<CardVariant, string> = {
      default: 'border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]',
      premium: 'border border-stone-200 bg-white shadow-md dark:border-white/8 dark:bg-white/[0.04]',
      glass: 'border border-white/[0.55] bg-white/[0.72] backdrop-blur-xl dark:border-white/8 dark:bg-white/5 dark:backdrop-blur-xl',
      outlined: 'border border-stone-200 bg-transparent dark:border-white/12'
    };
    return `${base} ${variants[this.variant()]}`;
  }

  bodyClasses(): string {
    const paddings: Record<CardPadding, string> = {
      none: '',
      sm: 'p-4',
      md: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8'
    };
    const accentPadding = this.accent() ? 'pl-8' : '';
    return `flex-1 ${paddings[this.padding()]} ${accentPadding}`.trim();
  }
}



