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
      routerLinkActive="bg-rose-50 text-rose-800 group"
      [routerLinkActiveOptions]="{ exact: exact }"
      class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-rose-800 transition-colors group mb-1"
    >
      <span class="flex-shrink-0 mr-3 h-5 w-5 text-gray-400 group-hover:text-rose-800 transition-colors">
        <ng-content select="[icon]"></ng-content>
      </span>
      <span class="flex-1">
        <ng-content></ng-content>
      </span>
      @if (badge) {
        <span class="bg-gray-100 text-gray-600 group-hover:bg-rose-100 group-hover:text-rose-800 ml-auto inline-block py-0.5 px-2 text-xs rounded-full">
          {{ badge }}
        </span>
      }
    </a>
  `
})
export class UiNavItemComponent {
  @Input() route!: string | any[];
  @Input() exact = false;
  @Input() badge?: string | number;
}
