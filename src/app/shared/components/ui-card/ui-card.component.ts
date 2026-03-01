import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CardVariant = 'default' | 'premium' | 'glass' | 'interactive' | 'outlined';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-card',
  template: `
    <div [class]="getContainerClasses()">
      @if (accent()) {
        <div class="absolute left-0 top-0 h-full w-1.5 {{ getAccentClass() }}" [style.backgroundColor]="getCustomAccentColor()"></div>
      }
      @if (title() || subtitle() || hasHeaderActions()) {
        <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-black/5 dark:border-white/5 z-10 relative">
          <div>
            @if (title()) {
              <h3 class="text-display font-medium text-lg leading-6">{{ title() }}</h3>
            }
            @if (subtitle()) {
              <p class="mt-1 text-sm text-text-muted">{{ subtitle() }}</p>
            }
          </div>
          @if (hasHeaderActions()) {
            <div class="flex items-center space-x-2">
              <ng-content select="[header-actions]"></ng-content>
            </div>
          }
        </div>
      }
      <div [class]="bodyClasses() + ' z-10 relative'">
        <ng-content></ng-content>
      </div>
      @if (hasFooter()) {
        <div class="px-6 py-4 border-t border-black/5 dark:border-white/5 bg-slate-50/30 z-10 relative dark:bg-black/10">
          <ng-content select="[footer]"></ng-content>
        </div>
      }
    </div>
  `
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
    const base = 'relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 ease-out';
    const variants: Record<CardVariant, string> = {
      default: 'glass-surface',
      premium: 'glass-surface shadow-md',
      interactive: 'glass-surface glass-surface-interactive',
      glass: 'glass-surface glass-surface-hover',
      outlined: 'border border-border-glass bg-transparent rounded-2xl'
    };
    return `${base} ${variants[this.variant()]}`;
  }

  bodyClasses(): string {
    const paddings: Record<CardPadding, string> = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };
    const accentPadding = this.accent() ? 'pl-8' : '';
    return `flex-1 ${paddings[this.padding()]} ${accentPadding}`.trim();
  }

  getAccentClass(): string {
    const a = this.accent();
    if (!a) return '';
    if (a === 'primary') return 'bg-primary-600 dark:bg-primary-500';
    if (a === 'secondary') return 'bg-slate-600 dark:bg-slate-500';
    if (a === 'success') return 'bg-success';
    if (a === 'warning') return 'bg-warning';
    if (a === 'danger') return 'bg-danger';
    if (a === 'info') return 'bg-info';
    return '';
  }

  getCustomAccentColor(): string | null {
    const a = this.accent();
    if (!a) return null;
    const predefined = ['primary', 'secondary', 'success', 'warning', 'danger', 'info'];
    if (!predefined.includes(a)) {
      return a;
    }
    return null;
  }
}
