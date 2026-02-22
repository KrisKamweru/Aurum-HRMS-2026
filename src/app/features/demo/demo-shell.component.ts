import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { UiNavItemComponent } from '../../shared/components/ui-nav-item/ui-nav-item.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demo-shell',
  imports: [RouterLink, RouterOutlet, UiNavItemComponent],
  template: `
    <section class="h-full overflow-hidden bg-[radial-gradient(circle_at_15%_10%,rgba(134,24,33,0.08),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(217,119,6,0.06),transparent_40%),#f5f3f0)] dark:bg-[#0b0b0b]">
      <div class="grid h-full min-h-0 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside class="min-h-0 border-b border-stone-200/70 bg-white/70 backdrop-blur-xl dark:border-white/8 dark:bg-white/5 lg:border-b-0 lg:border-r">
          <div class="flex h-full min-h-0 flex-col">
            <header class="border-b border-stone-200/70 px-5 py-5 dark:border-white/8">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy-700 dark:text-burgundy-400">
                Design Demo
              </p>
              <h1 class="mt-2 text-xl font-semibold text-stone-900 dark:text-stone-100">Shared UI Kit</h1>
              <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Rebuilt component playground using current shared components and patterns.
              </p>
            </header>

            <nav class="min-h-0 flex-1 overflow-y-auto px-2 py-3">
              <ui-nav-item [route]="['/demo/buttons']" [exact]="true">Buttons & Badges</ui-nav-item>
              <ui-nav-item [route]="['/demo/forms']" [exact]="true">Forms & Dynamic Form</ui-nav-item>
              <ui-nav-item [route]="['/demo/tables']" [exact]="true">Data Tables</ui-nav-item>
              <ui-nav-item [route]="['/demo/modals']" [exact]="true">Modals & Confirm</ui-nav-item>
              <ui-nav-item [route]="['/demo/date-picker']" [exact]="true">Date Range</ui-nav-item>

              <div class="mx-4 my-4 border-t border-stone-200/70 dark:border-white/8"></div>

              <a
                routerLink="/dashboard"
                class="mx-2 block rounded-lg px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                Back to Dashboard
              </a>
              <a
                routerLink="/6"
                class="mx-2 mt-1 block rounded-lg px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                Open Showcase /6
              </a>
            </nav>
          </div>
        </aside>

        <main class="min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <router-outlet />
        </main>
      </div>
    </section>
  `
})
export class DemoShellComponent {}
