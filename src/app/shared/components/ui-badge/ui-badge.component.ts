import { Component, Input } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'ui-badge',
  standalone: true,
  template: `
    <span [class]="getClasses()"><ng-content></ng-content></span>
  `
})
export class UiBadgeComponent {
  @Input() variant: BadgeVariant = 'neutral';
  @Input() size: BadgeSize = 'md';
  @Input() rounded = false;

  getClasses(): string {
    const base = 'inline-flex items-center font-semibold tracking-wide';
    const size = this.size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs';
    const radius = this.rounded ? 'rounded-full' : 'rounded-lg';

    const variantMap: Record<BadgeVariant, string> = {
      success: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
      warning: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
      danger: 'bg-red-100 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-300',
      info: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
      neutral: 'bg-stone-100 text-stone-700 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-300',
      primary: 'bg-burgundy-50 text-burgundy-700 ring-1 ring-burgundy-200 dark:bg-burgundy-700/20 dark:text-burgundy-300'
    };

    return `${base} ${size} ${radius} ${variantMap[this.variant]}`;
  }
}

