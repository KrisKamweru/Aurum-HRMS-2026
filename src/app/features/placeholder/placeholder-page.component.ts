import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  template: `
    <main class="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div class="mx-auto w-full max-w-4xl space-y-6">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Aurum HRMS Rebuild</p>
        <h1 class="text-3xl font-semibold tracking-tight">{{ title() }}</h1>
        <div class="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <p class="text-sm text-slate-300">
            Route
            <code class="rounded bg-slate-800 px-1.5 py-0.5 text-slate-100">{{ routePath() }}</code>
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
