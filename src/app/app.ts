import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <main class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_32%),linear-gradient(180deg,_#fffaf0_0%,_#f8fafc_48%,_#eef2ff_100%)] text-slate-950">
      <section class="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 px-6 py-16 sm:px-10">
        <div class="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/70 bg-amber-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-900">
          Fresh Reset Baseline
        </div>

        <div class="max-w-3xl space-y-4">
          <p class="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">
            Angular 21.2 + Convex
          </p>
          <h1 class="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            Aurum HRMS
          </h1>
          <p class="text-lg leading-8 text-slate-600 sm:text-xl">
            The workspace has been reset and re-bootstrapped with the core app shell, Tailwind 4,
            Vitest, and Playwright.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <article class="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
            <h2 class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              UI Foundation
            </h2>
            <p class="mt-3 text-sm leading-7 text-slate-600">
              Tailwind is available globally from <code class="font-semibold text-slate-900">src/styles.css</code>.
            </p>
          </article>

          <article class="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
            <h2 class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Unit Tests
            </h2>
            <p class="mt-3 text-sm leading-7 text-slate-600">
              <code class="font-semibold text-slate-900">npm test</code> runs Vitest against Angular standalone components.
            </p>
          </article>

          <article class="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
            <h2 class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Browser Checks
            </h2>
            <p class="mt-3 text-sm leading-7 text-slate-600">
              <code class="font-semibold text-slate-900">npm run e2e</code> uses Playwright with a local Angular dev server.
            </p>
          </article>
        </div>
      </section>

      <router-outlet />
    </main>
  `
})
export class App {}
