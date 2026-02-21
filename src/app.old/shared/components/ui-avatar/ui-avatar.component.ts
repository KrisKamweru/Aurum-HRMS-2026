import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'ui-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses()">
      @if (srcSignal()) {
        <img
          [src]="srcSignal()"
          [alt]="altSignal()"
          class="w-full h-full object-cover"
          (error)="hasError.set(true)"
        />
      }

      @if (!srcSignal() || hasError()) {
        <span [class]="textClasses()">
          {{ initials() }}
        </span>
      }

      @if (status) {
        <span [class]="statusClasses()"></span>
      }
    </div>
  `
})
export class UiAvatarComponent {
  // Inputs as signals would be nice in Angular 17.2+, but standard @Input with set is safer for now if version uncertain
  // Using standard @Input for compatibility but internal signals for logic

  @Input() set src(value: string | null | undefined) {
    this.srcSignal.set(value);
    this.hasError.set(false);
  }

  @Input() set alt(value: string) {
    this.altSignal.set(value);
  }

  @Input() set name(value: string | null | undefined) {
    this.nameSignal.set(value || '');
  }

  @Input() set size(value: AvatarSize) {
    this.sizeSignal.set(value);
  }

  @Input() set status(value: 'online' | 'offline' | 'busy' | 'away' | null) {
    this.statusSignal.set(value);
  }

  protected srcSignal = signal<string | null | undefined>(null);
  protected altSignal = signal<string>('Avatar');
  protected nameSignal = signal<string>('');
  protected sizeSignal = signal<AvatarSize>('md');
  protected statusSignal = signal<'online' | 'offline' | 'busy' | 'away' | null>(null);
  protected hasError = signal(false);

  protected initials = computed(() => {
    const name = this.nameSignal();
    if (!name) return '?';

    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  protected containerClasses = computed(() => {
    const base = 'relative inline-flex items-center justify-center rounded-full bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-200 overflow-hidden ring-2 ring-white dark:ring-stone-800 border border-stone-200 dark:border-stone-600 shadow-sm';

    const sizes = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16'
    };

    return `${base} ${sizes[this.sizeSignal()]}`;
  });

  protected textClasses = computed(() => {
    const sizes = {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-sm font-medium',
      lg: 'text-base font-medium',
      xl: 'text-xl font-bold'
    };
    return sizes[this.sizeSignal()];
  });

  protected statusClasses = computed(() => {
    const base = 'absolute bottom-0 right-0 block rounded-full ring-2 ring-white transform translate-y-1/4 translate-x-1/4';

    // Status dot size relative to avatar
    const sizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4'
    };

    const colors = {
      online: 'bg-emerald-400 ring-white dark:ring-stone-800',
      offline: 'bg-stone-300 ring-white dark:ring-stone-800',
      busy: 'bg-red-400 ring-white dark:ring-stone-800',
      away: 'bg-amber-400 ring-white dark:ring-stone-800'
    };

    const status = this.statusSignal();
    if (!status) return 'hidden';
    return `${base} ${sizes[this.sizeSignal()]} ${colors[status]}`;
  });
}
