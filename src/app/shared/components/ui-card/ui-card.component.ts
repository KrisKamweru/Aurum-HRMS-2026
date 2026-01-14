import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <!-- Header -->
      @if (title || subtitle || hasHeaderActions) {
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            @if (title) {
              <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
            }
            @if (subtitle) {
              <p class="text-sm text-gray-500 mt-0.5">{{ subtitle }}</p>
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
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <ng-content select="[footer]"></ng-content>
        </div>
      }
    </div>
  `
})
export class UiCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() hasHeaderActions = false; // Manually trigger header if only actions present
  @Input() hasFooter = false;

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
