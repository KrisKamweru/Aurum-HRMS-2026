import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="getContainerClasses()">
      <!-- Accent stripe (inside the card, follows rounded corners) -->
      @if (accent) {
        <div
          class="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          [ngClass]="accent"
        ></div>
      }

      <!-- Header -->
      @if (title || subtitle || hasHeaderActions) {
        <div class="px-6 py-4 border-b border-stone-100 dark:border-stone-700 flex items-center justify-between" [class.bg-stone-50]="variant === 'default'" [class.dark:bg-stone-800]="variant === 'default'" [class.pl-8]="accent">
          <div>
            @if (title) {
              <h3 class="text-lg font-bold text-stone-900 dark:text-stone-100">{{ title }}</h3>
            }
            @if (subtitle) {
              <p class="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{{ subtitle }}</p>
            }
          </div>
          <div class="flex items-center gap-2">
            <ng-content select="[header-actions]"></ng-content>
          </div>
        </div>
      }

      <!-- Body -->
      <div [class]="bodyClasses()">
        <ng-content></ng-content>
      </div>

      <!-- Footer -->
      @if (hasFooter) {
        <div class="px-6 py-4 bg-stone-50 dark:bg-stone-800 border-t border-stone-100 dark:border-stone-700" [class.pl-8]="accent">
          <ng-content select="[footer]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class UiCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'default' | 'premium' | 'glass' | 'outlined' = 'default';
  @Input() accent?: string; // Tailwind bg class like 'bg-primary-600' or 'bg-amber-500'
  @Input() hasHeaderActions = false;
  @Input() hasFooter = false;

  getContainerClasses(): string {
    const baseClasses = 'overflow-hidden h-full flex flex-col transition-all duration-300 relative';

    const variants = {
      default: 'bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700',
      premium: 'card-premium dark:bg-stone-800 dark:border-stone-700', // Ensure premium also respects dark bg base
      glass: 'card-glass dark:bg-stone-800/80 dark:border-stone-700/50',     // Ensure glass respects dark bg base
      outlined: 'bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700'
    };

    return `${baseClasses} ${variants[this.variant]}`;
  }

  bodyClasses(): string {
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    // Add extra left padding when accent is present
    const accentPadding = this.accent ? 'pl-8' : '';

    return `flex-1 ${paddings[this.padding]} ${accentPadding}`.trim();
  }
}
