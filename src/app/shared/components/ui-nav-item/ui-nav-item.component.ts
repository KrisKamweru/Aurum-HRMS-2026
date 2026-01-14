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
      class="nav-link group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-stone-600 hover:text-[#8b1e3f] hover:bg-[#fdf2f4] transition-all duration-200 mb-1 relative overflow-hidden"
    >
      <!-- Active indicator bar -->
      <span class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-[#a82349] to-[#8b1e3f] rounded-r-full transition-all duration-200 group-[.nav-active]:h-6"></span>

      <!-- Icon slot -->
      <span class="flex-shrink-0 w-5 h-5 text-stone-400 group-hover:text-[#8b1e3f] group-[.nav-active]:text-[#8b1e3f] transition-colors">
        <ng-content select="[icon]"></ng-content>
      </span>

      <!-- Label -->
      <span class="flex-1 group-[.nav-active]:text-[#8b1e3f] group-[.nav-active]:font-semibold">
        <ng-content></ng-content>
      </span>

      <!-- Badge -->
      @if (badge) {
        <span class="bg-[#fce7eb] text-[#8b1e3f] group-hover:bg-[#f9d0da] ml-auto inline-block py-0.5 px-2.5 text-xs font-semibold rounded-full transition-colors">
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
  `]
})
export class UiNavItemComponent {
  @Input() route!: string | any[];
  @Input() exact = false;
  @Input() badge?: string | number;
}
