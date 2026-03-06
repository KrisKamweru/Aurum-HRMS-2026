import { Component, input, ChangeDetectionStrategy } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
export type BadgeSize = 'sm' | 'md';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-badge',
  template: `
    <span [class]="getClasses()">
      <ng-content></ng-content>
    </span>
  `
})
export class UiBadgeComponent {
  readonly variant = input<BadgeVariant>('neutral');
  readonly size = input<BadgeSize>('md');
  readonly rounded = input(true); // default to rounded-full for badges in frosted clarity

  getClasses(): string {
    const base = 'inline-flex items-center font-semibold tracking-wide backdrop-blur-md';
    const size = this.size() === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';
    const radius = this.rounded() ? 'rounded-full' : 'rounded-xl';

    const variantMap: Record<BadgeVariant, string> = {
      success: 'bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/30',
      warning: 'bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-500/30',
      danger: 'bg-red-500/15 text-red-800 ring-1 ring-red-500/30 dark:bg-red-500/20 dark:text-red-300 dark:ring-red-500/30',
      info: 'bg-slate-500/15 text-slate-800 ring-1 ring-slate-500/30 dark:bg-slate-500/20 dark:text-slate-300 dark:ring-slate-500/30',
      neutral: 'bg-(--color-bg-surface-elevated) text-slate-800 ring-1 ring-black/5 dark:text-slate-300 dark:ring-white/10',
      primary: 'bg-primary-800/15 text-primary-900 ring-1 ring-primary-800/30 dark:bg-primary-600/20 dark:text-primary-300 dark:ring-primary-600/30'
    };

    return `${base} ${size} ${radius} ${variantMap[this.variant()]}`;
  }
}
