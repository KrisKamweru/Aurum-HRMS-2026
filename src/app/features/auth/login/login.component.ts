import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-4xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Authentication</p>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Sign In</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Use your organization credentials to access rebuilt routes with real Convex-backed authorization.
          </p>
        </header>

        <section class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-6 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/5 dark:backdrop-blur-xl">
          @if (error()) {
            <p class="mb-4 rounded-xl border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
              {{ error() }}
            </p>
          }

          <form [formGroup]="loginForm" class="grid gap-4 md:grid-cols-2" (ngSubmit)="submit()">
            <div class="space-y-1 md:col-span-2">
              <label for="email" class="block text-sm font-medium text-stone-700 dark:text-stone-300">Email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                autocomplete="username"
                placeholder="you@company.com"
                class="w-full rounded-[10px] border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-100"
              />
            </div>

            <div class="space-y-1 md:col-span-2">
              <label for="password" class="block text-sm font-medium text-stone-700 dark:text-stone-300">Password</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                autocomplete="current-password"
                placeholder="Enter your password"
                class="w-full rounded-[10px] border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-100"
              />
            </div>

            <div class="md:col-span-2 flex justify-end">
              <button
                type="submit"
                class="rounded-[10px] bg-burgundy-700 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(134,24,33,0.35)] transition-all hover:-translate-y-0.5 hover:bg-burgundy-600 disabled:cursor-not-allowed disabled:opacity-60"
                [disabled]="isSubmitting() || auth.isLoading()"
              >
                {{ isSubmitting() ? 'Signing In...' : 'Sign In' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthSessionService);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });
  readonly isSubmitting = signal(false);
  readonly error = signal<string | null>(null);

  constructor(
    private readonly router: Router
  ) {}

  async submit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.isSubmitting.set(true);
    this.error.set(null);

    try {
      const success = await this.auth.loginWithPassword(email, password);
      if (!success) {
        this.error.set('Unable to sign in. Check your credentials and try again.');
        return;
      }

      const role = this.auth.user()?.role;
      if (role === 'pending') {
        await this.router.navigate(['/pending']);
        return;
      }
      await this.router.navigate(['/dashboard']);
    } catch {
      this.error.set('Unable to sign in right now. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
