import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'ui-nav-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a
      [routerLink]="route"
      routerLinkActive="nav-active"
      [routerLinkActiveOptions]="{ exact: exact }"
      class="group relative mb-1 flex items-center gap-3 rounded-r-lg border-l-2 border-transparent px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-burgundy-50 hover:text-burgundy-700 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-burgundy-300"
    >
      <span class="flex h-5 w-5 items-center justify-center text-stone-400 group-hover:text-burgundy-700 dark:text-stone-500 dark:group-hover:text-burgundy-300"><ng-content select="[icon]"></ng-content></span>
      <span class="flex-1"><ng-content></ng-content></span>
      @if (badge !== undefined && badge !== null) {
        <span class="rounded-full bg-burgundy-100 px-2.5 py-0.5 text-xs font-semibold text-burgundy-700 dark:bg-burgundy-700/20 dark:text-burgundy-300">{{ badge }}</span>
      }
    </a>
  `
})
export class UiNavItemComponent {
  @Input({ required: true }) route!: string | readonly unknown[];
  @Input() exact = false;
  @Input() badge?: string | number;
}

