import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="getContainerClasses()">
      <!-- Header -->
      @if (title || subtitle || hasHeaderActions) {
        <div class="px-6 py-4 border-b border-stone-100 flex items-center justify-between" [class.bg-stone-50]="variant === 'default'">
          <div>
            @if (title) {
              <h3 class="text-lg font-bold text-stone-900">{{ title }}</h3>
            }
            @if (subtitle) {
              <p class="text-sm text-stone-500 mt-0.5">{{ subtitle }}</p>
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
        <div class="px-6 py-4 bg-stone-50 border-t border-stone-100">
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
  @Input() hasHeaderActions = false;
  @Input() hasFooter = false;

  getContainerClasses(): string {
    const baseClasses = 'overflow-hidden h-full flex flex-col transition-all duration-300';

    const variants = {
      default: 'bg-white rounded-2xl shadow-sm border border-stone-200',
      premium: 'card-premium',
      glass: 'card-glass',
      outlined: 'bg-white rounded-2xl border border-stone-200'
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
    return `flex-1 ${paddings[this.padding]}`;
  }
}
