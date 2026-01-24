import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

@Component({
  selector: 'ui-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="getClasses()">
      <ng-content></ng-content>
    </span>
  `
})
export class UiBadgeComponent {
  @Input() variant: BadgeVariant = 'neutral';
  @Input() size: 'sm' | 'md' = 'md';
  @Input() rounded: boolean = false;

  getClasses(): string {
    const baseClasses = 'inline-flex items-center font-semibold tracking-wide';

    const sizeClasses = {
      sm: 'px-2.5 py-0.5 text-[10px]',
      md: 'px-3 py-1 text-xs'
    };

    const radiusClass = this.rounded ? 'rounded-full' : 'rounded-lg';

    const variantClasses = {
      success: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 dark:text-emerald-300 dark:ring-emerald-800/50',
      warning: 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 ring-1 ring-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 dark:text-amber-300 dark:ring-amber-800/50',
      danger: 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 ring-1 ring-red-200 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-300 dark:ring-red-800/50',
      info: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 ring-1 ring-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-300 dark:ring-blue-800/50',
      neutral: 'bg-gradient-to-br from-stone-50 to-stone-100 text-stone-600 ring-1 ring-stone-200 dark:from-stone-800 dark:to-stone-700 dark:text-stone-300 dark:ring-stone-600',
      primary: 'bg-gradient-to-br from-[#fdf2f4] to-[#fce7eb] text-[#8b1e3f] ring-1 ring-[#f9d0da] dark:from-[#8b1e3f]/20 dark:to-[#722038]/20 dark:text-[#fce7eb] dark:ring-[#8b1e3f]/40'
    };

    return `${baseClasses} ${sizeClasses[this.size]} ${radiusClass} ${variantClasses[this.variant]}`;
  }
}
