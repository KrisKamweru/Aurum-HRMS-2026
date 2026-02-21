import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl space-y-6">
        <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Aurum HRMS Rebuild</p>
        <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">{{ title() }}</h1>
        <div class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/5 dark:backdrop-blur-xl">
          <p class="text-sm text-stone-700 dark:text-stone-300">
            Route
            <code class="rounded bg-stone-200 px-1.5 py-0.5 text-stone-800 dark:bg-white/10 dark:text-stone-100">{{ routePath() }}</code>
            is mapped in the new shell and queued for functional rebuild.
          </p>
        </div>
      </div>
    </main>
  `
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = toSignal(
    this.route.data.pipe(map((data) => (typeof data['title'] === 'string' ? data['title'] : 'Rebuild Placeholder'))),
    { initialValue: 'Rebuild Placeholder' }
  );

  readonly routePath = toSignal(
    this.route.data.pipe(
      map(() => (typeof this.route.snapshot.routeConfig?.path === 'string' ? this.route.snapshot.routeConfig.path : '/'))
    ),
    { initialValue: '/' }
  );
}
