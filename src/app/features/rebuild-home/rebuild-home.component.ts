import { Component } from '@angular/core';

@Component({
  selector: 'app-rebuild-home',
  standalone: true,
  template: `
    <main class="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div class="mx-auto w-full max-w-3xl space-y-8">
        <h1 class="text-4xl font-semibold tracking-tight">Aurum HRMS Rebuild</h1>
        <p class="text-base text-slate-300">
          New application shell is active. Legacy implementation is archived in
          <code class="rounded bg-slate-800 px-1.5 py-0.5 text-slate-100">src/app.old</code>.
        </p>
        <section class="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <p class="text-sm uppercase tracking-[0.2em] text-slate-400">Current Status</p>
          <p class="mt-2 text-lg">{{ phaseLabel }}</p>
        </section>
      </div>
    </main>
  `
})
export class RebuildHomeComponent {
  readonly phaseLabel = 'Phase 2: Legacy archived';
}
