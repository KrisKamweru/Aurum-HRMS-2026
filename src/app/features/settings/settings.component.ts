import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, UiIconComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="heading-accent">Settings</h1>
          <p class="text-stone-500 mt-1">Manage organization configuration and preferences.</p>
        </div>
      </div>

      <div class="flex flex-col md:flex-row gap-8">
        <!-- Sidebar Navigation -->
        <div class="w-full md:w-64 flex-shrink-0 space-y-1">
          <a
            routerLink="general"
            routerLinkActive="bg-stone-100 text-[#8b1e3f] dark:bg-stone-800 dark:text-[#fce7eb] font-semibold"
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
          >
            <ui-icon name="cog-6-tooth" class="w-5 h-5 group-[.text-[#8b1e3f]]:text-[#8b1e3f] group-[.font-semibold]:text-[#8b1e3f]"></ui-icon>
            General
          </a>
          <a
            routerLink="leave-policies"
            routerLinkActive="bg-stone-100 text-[#8b1e3f] dark:bg-stone-800 dark:text-[#fce7eb] font-semibold"
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
          >
            <ui-icon name="calendar" class="w-5 h-5 group-[.text-[#8b1e3f]]:text-[#8b1e3f] group-[.font-semibold]:text-[#8b1e3f]"></ui-icon>
            Leave Policies
          </a>
          <!-- Placeholder for future settings -->
          <a
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-400 cursor-not-allowed opacity-60"
          >
            <ui-icon name="users" class="w-5 h-5"></ui-icon>
            Roles & Permissions
            <span class="text-[10px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded ml-auto">Soon</span>
          </a>
        </div>

        <!-- Content Area -->
        <div class="flex-1 min-w-0">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {}
