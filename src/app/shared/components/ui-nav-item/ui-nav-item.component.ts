import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'ui-nav-item',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <a
      [routerLink]="route"
      routerLinkActive="nav-active"
      [routerLinkActiveOptions]="{ exact: exact }"
      class="nav-link group flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-stone-600 dark:text-stone-400 hover:text-burgundy-800 dark:hover:text-burgundy-300 hover:bg-burgundy-50 dark:hover:bg-white/5 transition-all duration-200 mb-1 relative overflow-hidden"
    >
      <!-- Active indicator bar with gold accent -->
      <span class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full transition-all duration-300 ease-out group-[.nav-active]:h-6 overflow-hidden">
        <span class="absolute inset-0 bg-gradient-to-b from-gold-400 via-burgundy-700 to-burgundy-800"></span>
      </span>

      <!-- Icon slot -->
      <span class="flex-shrink-0 w-5 h-5 text-stone-400 dark:text-stone-500 group-hover:text-burgundy-800 dark:group-hover:text-burgundy-300 group-[.nav-active]:text-burgundy-800 dark:group-[.nav-active]:text-burgundy-300 transition-colors duration-200">
        <ng-content select="[icon]"></ng-content>
      </span>

      <!-- Label -->
      <span class="flex-1 group-[.nav-active]:text-burgundy-800 dark:group-[.nav-active]:text-burgundy-300 group-[.nav-active]:font-semibold transition-all duration-200">
        <ng-content></ng-content>
      </span>

      <!-- Badge -->
      @if (badge) {
        <span class="bg-gradient-to-br from-burgundy-100 to-burgundy-50 dark:from-burgundy-900 dark:to-burgundy-800 text-burgundy-800 dark:text-burgundy-200 group-hover:from-burgundy-200 group-hover:to-burgundy-100 dark:group-hover:from-burgundy-800 dark:group-hover:to-burgundy-700 ml-auto inline-block py-0.5 px-2.5 text-xs font-semibold rounded-full transition-all duration-200 ring-1 ring-burgundy-200/50 dark:ring-burgundy-700/50">
          {{ badge }}
        </span>
      }
    </a>
  `,
  styles: [`
    :host {
      display: block;
    }

    .nav-link.nav-active {
      background: linear-gradient(90deg, #fdf2f4, transparent);
      color: #8b1e3f;
    }

    :host-context(.dark) .nav-link.nav-active {
      background: linear-gradient(90deg, rgba(139, 30, 63, 0.2), transparent);
      color: #fce7eb;
    }
  `]
})
export class UiNavItemComponent {
  @Input() route!: string | any[];
  @Input() exact = false;
  @Input() badge?: string | number;
}
