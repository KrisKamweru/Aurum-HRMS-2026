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
      success: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
      warning: 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 ring-1 ring-amber-200',
      danger: 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 ring-1 ring-red-200',
      info: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 ring-1 ring-blue-200',
      neutral: 'bg-gradient-to-br from-stone-50 to-stone-100 text-stone-600 ring-1 ring-stone-200',
      primary: 'bg-gradient-to-br from-[#fdf2f4] to-[#fce7eb] text-[#8b1e3f] ring-1 ring-[#f9d0da]'
    };

    return `${baseClasses} ${sizeClasses[this.size]} ${radiusClass} ${variantClasses[this.variant]}`;
  }
}
