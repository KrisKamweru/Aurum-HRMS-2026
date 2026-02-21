import { Component, Input } from '@angular/core';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away' | null;

@Component({
  selector: 'ui-avatar',
  standalone: true,
  template: `
    <span [class]="containerClasses()">
      @if (src && !hasError) {
        <img [src]="src" [alt]="alt" class="h-full w-full object-cover" (error)="hasError = true" />
      } @else {
        <span [class]="textClasses()">{{ initials() }}</span>
      }

      @if (status) {
        <span [class]="statusClasses()"></span>
      }
    </span>
  `
})
export class UiAvatarComponent {
  @Input() src: string | null = null;
  @Input() alt = 'Avatar';
  @Input() name = '';
  @Input() size: AvatarSize = 'md';
  @Input() status: AvatarStatus = null;

  hasError = false;

  initials(): string {
    const trimmed = this.name.trim();
    if (!trimmed) {
      return '?';
    }
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  containerClasses(): string {
    const sizeMap: Record<AvatarSize, string> = {
      xs: 'h-6 w-6',
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16'
    };
    return `relative inline-flex items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-100 text-stone-700 dark:border-white/10 dark:bg-white/10 dark:text-stone-200 ${sizeMap[this.size]}`;
  }

  textClasses(): string {
    const sizeMap: Record<AvatarSize, string> = {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-sm font-medium',
      lg: 'text-base font-semibold',
      xl: 'text-xl font-bold'
    };
    return sizeMap[this.size];
  }

  statusClasses(): string {
    const sizeMap: Record<AvatarSize, string> = {
      xs: 'h-1.5 w-1.5',
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
      xl: 'h-4 w-4'
    };
    const colorMap: Record<Exclude<AvatarStatus, null>, string> = {
      online: 'bg-emerald-400',
      offline: 'bg-stone-300',
      busy: 'bg-red-400',
      away: 'bg-amber-400'
    };
    const status = this.status ?? 'offline';
    return `absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-[#0b0b0b] ${sizeMap[this.size]} ${colorMap[status]}`;
  }
}

