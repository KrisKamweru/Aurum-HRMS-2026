import { Component, Input } from '@angular/core';

export type CardVariant = 'default' | 'premium' | 'glass' | 'outlined';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-card',
  standalone: true,
  template: `
    <section [class]="getContainerClasses()">
      @if (accent) {
        <span class="absolute inset-y-0 left-0 w-1 rounded-l-2xl" [class]="accent"></span>
      }

      @if (title || subtitle || hasHeaderActions) {
        <header class="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-white/8" [class.pl-8]="!!accent">
          <div>
            @if (title) {
              <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100">{{ title }}</h3>
            }
            @if (subtitle) {
              <p class="text-sm text-stone-500 dark:text-stone-400">{{ subtitle }}</p>
            }
          </div>
          <div class="flex items-center gap-2"><ng-content select="[header-actions]"></ng-content></div>
        </header>
      }

      <div [class]="bodyClasses()"><ng-content></ng-content></div>

      @if (hasFooter) {
        <footer class="border-t border-stone-100 px-5 py-4 dark:border-white/8" [class.pl-8]="!!accent">
          <ng-content select="[footer]"></ng-content>
        </footer>
      }
    </section>
  `
})
export class UiCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() padding: CardPadding = 'md';
  @Input() variant: CardVariant = 'default';
  @Input() accent?: string;
  @Input() hasHeaderActions = false;
  @Input() hasFooter = false;

  getContainerClasses(): string {
    const base = 'relative flex h-full flex-col overflow-hidden rounded-2xl transition-all';
    const variants: Record<CardVariant, string> = {
      default: 'border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]',
      premium: 'border border-stone-200 bg-white shadow-md dark:border-white/8 dark:bg-white/[0.04]',
      glass: 'border border-white/[0.55] bg-white/[0.72] backdrop-blur-xl dark:border-white/8 dark:bg-white/5 dark:backdrop-blur-xl',
      outlined: 'border border-stone-200 bg-transparent dark:border-white/12'
    };
    return `${base} ${variants[this.variant]}`;
  }

  bodyClasses(): string {
    const paddings: Record<CardPadding, string> = {
      none: '',
      sm: 'p-4',
      md: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8'
    };
    const accentPadding = this.accent ? 'pl-8' : '';
    return `flex-1 ${paddings[this.padding]} ${accentPadding}`.trim();
  }
}

