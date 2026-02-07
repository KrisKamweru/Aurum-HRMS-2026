import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiNavItemComponent } from '../../shared/components/ui-nav-item/ui-nav-item.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-core-hr-layout',
  standalone: true,
  imports: [RouterOutlet, UiNavItemComponent, UiIconComponent],
  template: `
    <div class="flex h-full flex-col">
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">Core HR</h1>
        <p class="text-stone-500 dark:text-stone-400">Manage employee lifecycle events and records</p>
      </div>

      <div class="flex flex-1 gap-8">
        <!-- Sidebar Navigation -->
        <aside class="w-64 flex-shrink-0">
          <nav class="flex flex-col gap-1">
            <ui-nav-item route="promotions" [exact]="true">
              <ui-icon name="trending-up" icon class="w-5 h-5" />
              Promotions
            </ui-nav-item>
            <ui-nav-item route="transfers" [exact]="true">
              <ui-icon name="arrow-right-left" icon class="w-5 h-5" />
              Transfers
            </ui-nav-item>
            <ui-nav-item route="awards" [exact]="true">
              <ui-icon name="award" icon class="w-5 h-5" />
              Awards
            </ui-nav-item>
            <ui-nav-item route="warnings" [exact]="true">
              <ui-icon name="alert-triangle" icon class="w-5 h-5" />
              Warnings
            </ui-nav-item>
            <ui-nav-item route="resignations" [exact]="true">
              <ui-icon name="file-minus" icon class="w-5 h-5" />
              Resignations
            </ui-nav-item>
            <ui-nav-item route="terminations" [exact]="true">
              <ui-icon name="user-x" icon class="w-5 h-5" />
              Terminations
            </ui-nav-item>
            <ui-nav-item route="complaints" [exact]="true">
              <ui-icon name="message-square-warning" icon class="w-5 h-5" />
              Complaints
            </ui-nav-item>
            <ui-nav-item route="travel" [exact]="true">
              <ui-icon name="plane" icon class="w-5 h-5" />
              Travel Requests
            </ui-nav-item>
          </nav>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 min-w-0">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class CoreHrLayoutComponent {}
