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
          <h1 class="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">Settings</h1>
          <p class="text-[15px] text-stone-600 dark:text-stone-400 mt-2">Manage organization configuration and preferences.</p>
        </div>
      </div>

      <div class="flex flex-col md:flex-row gap-8">
        <!-- Sidebar Navigation -->
        <div class="w-full md:w-64 flex-shrink-0 space-y-1">
          <a
            routerLink="general"
            routerLinkActive="bg-burgundy-50 text-burgundy-700 border-l-3 border-burgundy-700 dark:bg-burgundy-700/12 dark:text-burgundy-300 dark:border-burgundy-400 font-semibold"
            class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <ui-icon name="cog-6-tooth" class="w-5 h-5"></ui-icon>
            General
          </a>
          <a
            routerLink="leave-policies"
            routerLinkActive="bg-burgundy-50 text-burgundy-700 border-l-3 border-burgundy-700 dark:bg-burgundy-700/12 dark:text-burgundy-300 dark:border-burgundy-400 font-semibold"
            class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <ui-icon name="calendar" class="w-5 h-5"></ui-icon>
            Leave Policies
          </a>
          <!-- Placeholder for future settings -->
          <div class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-stone-400 dark:text-stone-500 cursor-not-allowed opacity-60">
            <ui-icon name="users" class="w-5 h-5"></ui-icon>
            Roles & Permissions
            <span class="text-[10px] bg-stone-100 dark:bg-stone-700 px-1.5 py-0.5 rounded-full ml-auto font-semibold">Soon</span>
          </div>
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
