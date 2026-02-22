import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { OAuthProvider } from '../../../core/auth/auth.types';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiFormFieldComponent } from '../../../shared/components/ui-form-field/ui-form-field.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent, UiFormFieldComponent],
  template: `
    <main class="h-full overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_1.35fr]">
        <section
          class="rounded-2xl border border-white/[0.6] bg-white/[0.7] p-6 shadow-[0_20px_60px_rgba(28,25,23,0.08)] backdrop-blur-xl dark:border-white/8 dark:bg-white/5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-burgundy-700 dark:text-burgundy-400">
            Authentication
          </p>
          <h1 class="mt-3 text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Create Account</h1>
          <p class="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">
            Create a password account for your organization workspace. New accounts may enter the onboarding queue before
            an admin completes access setup.
          </p>

          <div class="mt-6 space-y-3 rounded-2xl border border-white/60 bg-white/60 p-4 dark:border-white/6 dark:bg-white/5">
            <h2 class="text-sm font-semibold text-stone-900 dark:text-stone-100">What happens next</h2>
            <ul class="space-y-2 text-sm text-stone-600 dark:text-stone-400">
              <li>Use your work email to improve organization matching.</li>
              <li>Pending users are routed to the onboarding access hub after sign-up.</li>
              <li>Existing admins may sign in with Google or Microsoft if configured.</li>
            </ul>
          </div>

          <div class="mt-6 flex flex-wrap gap-3 text-sm">
            <a routerLink="/auth/login" class="font-medium text-burgundy-700 hover:text-burgundy-600 dark:text-burgundy-400">
              Already have an account? Sign in
            </a>
            <a
              routerLink="/auth/forgot-password"
              class="font-medium text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            >
              Forgot password
            </a>
          </div>
        </section>

        <section
          class="rounded-2xl border border-white/[0.6] bg-white/[0.76] p-6 shadow-[0_24px_60px_rgba(134,24,33,0.08)] backdrop-blur-xl dark:border-white/8 dark:bg-white/5"
        >
          @if (error()) {
            <p
              class="mb-4 rounded-xl border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
            >
              {{ error() }}
            </p>
          }

          <form [formGroup]="registerForm" class="space-y-5" (ngSubmit)="submit()">
            <div class="grid gap-4 md:grid-cols-2">
              <ui-form-field
                label="Full Name"
                [required]="true"
                [control]="registerForm.controls.name"
                class="md:col-span-2"
              >
                <input
                  id="name"
                  type="text"
                  formControlName="name"
                  autocomplete="name"
                  placeholder="Jane Doe"
                  class="w-full rounded-[10px] border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-100"
                />
              </ui-form-field>

              <ui-form-field label="Work Email" [required]="true" [control]="registerForm.controls.email">
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  placeholder="you@company.com"
                  class="w-full rounded-[10px] border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-100"
                />
              </ui-form-field>

              <ui-form-field
                label="Password"
                [required]="true"
                hint="Minimum 8 characters"
                [control]="registerForm.controls.password"
              >
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  autocomplete="new-password"
                  placeholder="Create a strong password"
                  class="w-full rounded-[10px] border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-100"
                />
              </ui-form-field>
            </div>

            <ui-button
              type="submit"
              [fullWidth]="true"
              [loading]="isSubmitting()"
              [disabled]="isSubmitting() || auth.isLoading()"
            >
              Create Account
            </ui-button>
          </form>

          <div class="my-5 flex items-center gap-3">
            <div class="h-px flex-1 bg-stone-200/90 dark:bg-white/10"></div>
            <span class="text-xs uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">or continue with</span>
            <div class="h-px flex-1 bg-stone-200/90 dark:bg-white/10"></div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <ui-button
              variant="secondary"
              [fullWidth]="true"
              [disabled]="isSubmitting() || auth.isLoading() || oauthSubmittingProvider() !== null"
              (onClick)="startProviderSignIn('google')"
            >
              Google
            </ui-button>
            <ui-button
              variant="secondary"
              [fullWidth]="true"
              [disabled]="isSubmitting() || auth.isLoading() || oauthSubmittingProvider() !== null"
              (onClick)="startProviderSignIn('microsoft')"
            >
              Microsoft
            </ui-button>
          </div>
        </section>
      </div>
    </main>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly auth = inject(AuthSessionService);

  readonly registerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });
  readonly isSubmitting = signal(false);
  readonly oauthSubmittingProvider = signal<OAuthProvider | null>(null);
  readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.registerForm.getRawValue();
    this.isSubmitting.set(true);
    this.error.set(null);

    try {
      const success = await this.auth.registerWithPassword(name.trim(), email.trim(), password);
      if (!success) {
        this.error.set('Unable to create account. Verify your details and try again.');
        return;
      }

      const role = this.auth.user()?.role;
      if (role === 'pending') {
        await this.router.navigate(['/pending']);
        return;
      }
      await this.router.navigate(['/dashboard']);
    } catch {
      this.error.set('Unable to create account right now. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async startProviderSignIn(provider: OAuthProvider): Promise<void> {
    this.error.set(null);
    this.oauthSubmittingProvider.set(provider);
    try {
      const success = await this.auth.signInWithProvider(provider);
      if (!success) {
        this.error.set(`Unable to start ${provider} sign-in right now.`);
      }
    } catch {
      this.error.set(`Unable to start ${provider} sign-in right now.`);
    } finally {
      this.oauthSubmittingProvider.set(null);
    }
  }
}
