import { Component } from '@angular/core';

@Component({
  selector: 'app-rebuild-home',
  standalone: true,
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Aurum HRMS Rebuild</p>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Dashboard</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            New application shell is active. Legacy implementation is archived in
            <code class="rounded bg-stone-200 px-1.5 py-0.5 text-stone-800 dark:bg-white/10 dark:text-stone-100">src/app.old</code>.
          </p>
        </header>

        <section class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Current Status</p>
          <p class="mt-2 text-lg font-semibold text-stone-900 dark:text-stone-100">{{ phaseLabel }}</p>
        </section>

        <section class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-6 backdrop-blur-xl dark:border-white/8 dark:bg-white/5 dark:backdrop-blur-xl">
          <p class="text-sm text-stone-700 dark:text-stone-300">
            Use this dashboard as the rebuild command center. New feature pages should follow the adaptive glass rules: transient-first, contrast-safe, and internal scrolling boundaries.
          </p>
        </section>
      </div>
    </main>
  `
})
export class RebuildHomeComponent {
  readonly phaseLabel = 'Phase 2: Legacy archived';
}
