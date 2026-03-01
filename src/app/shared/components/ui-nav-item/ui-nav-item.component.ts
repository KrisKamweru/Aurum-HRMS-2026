import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-nav-item',
  imports: [RouterLink, RouterLinkActive, UiIconComponent],
  template: `
    <a 
      [routerLink]="route()" 
      [routerLinkActive]="'bg-white/60 dark:bg-white/10 text-primary-800 dark:text-primary-400 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-white/60 dark:border-white/10'" 
      [routerLinkActiveOptions]="{exact: exact()}"
      class="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 outline-none border border-transparent
             text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 hover:border-white/40 dark:hover:border-white/5 group"
    >
      @if (icon()) {
        <ui-icon [name]="icon()!" class="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity drop-shadow-sm"></ui-icon>
      }
      <span class="flex-1">{{ label() }}</span>
      @if (badge() !== undefined && badge() !== null) {
        <span class="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-[10px] font-bold text-primary-800 dark:text-primary-300 tracking-wider shadow-sm">{{ badge() }}</span>
      }
    </a>
  `
})
export class UiNavItemComponent {
  readonly route = input.required<string | readonly unknown[]>();
  readonly label = input.required<string>();
  readonly icon = input<string>();
  readonly exact = input(false);
  readonly badge = input<string | number>();
}



