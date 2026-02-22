import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { PasswordResetRequestResult } from '../../../core/auth/auth.types';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiFormFieldComponent } from '../../../shared/components/ui-form-field/ui-form-field.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent, UiFormFieldComponent],
  template: `
    <main class="h-full overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-3xl space-y-6">
        <header
          class="rounded-2xl border border-white/[0.6] bg-white/[0.72] p-6 shadow-[0_20px_60px_rgba(28,25,23,0.08)] backdrop-blur-xl dark:border-white/8 dark:bg-white/5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-burgundy-700 dark:text-burgundy-400">
            Authentication
          </p>
          <h1 class="mt-3 text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Reset Password</h1>
          <p class="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">
            Enter your account email to request a password reset. If the reset backend is unavailable, this page will
            tell you exactly what to do next.
          </p>
          <a
            routerLink="/auth/login"
            class="mt-4 inline-flex text-sm font-medium text-burgundy-700 hover:text-burgundy-600 dark:text-burgundy-400"
          >
            Back to sign in
          </a>
        </header>

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

          @if (requestResult(); as result) {
            <div
              class="rounded-xl border px-4 py-4 text-sm"
              [class]="
                result.status === 'sent'
                  ? 'border-green-200 bg-green-50/90 text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-300'
                  : 'border-amber-200 bg-amber-50/90 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200'
              "
            >
              <p class="font-semibold">
                {{ result.status === 'sent' ? 'Reset link sent' : 'Reset flow currently unavailable' }}
              </p>
              <p class="mt-1 leading-6">{{ result.message }}</p>
              @if (result.status === 'unsupported') {
                <p class="mt-2 text-xs opacity-85">
                  Temporary rebuild limitation: contact an administrator to reset your access, or use an external SSO
                  provider if your organization enabled it.
                </p>
              }
            </div>
          }

          <form [formGroup]="forgotPasswordForm" class="mt-5 space-y-5" (ngSubmit)="submit()">
            <ui-form-field label="Email Address" [required]="true" [control]="forgotPasswordForm.controls.email">
              <input
                id="forgot-email"
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="you@company.com"
                class="w-full rounded-[10px] border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-100"
              />
            </ui-form-field>

            <div class="flex flex-wrap items-center gap-3">
              <ui-button type="submit" [loading]="isSubmitting()" [disabled]="isSubmitting() || auth.isLoading()">
                Send Reset Link
              </ui-button>
              <a
                routerLink="/auth/login"
                class="text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
              >
                Cancel
              </a>
            </div>
          </form>
        </section>
      </div>
    </main>
  `
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);

  readonly auth = inject(AuthSessionService);

  readonly forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });
  readonly isSubmitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly requestResult = signal<PasswordResetRequestResult | null>(null);

  async submit(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);
    this.requestResult.set(null);

    try {
      const { email } = this.forgotPasswordForm.getRawValue();
      const result = await this.auth.requestPasswordReset(email.trim());
      this.requestResult.set(result);
    } catch {
      this.error.set('Unable to process your reset request right now. Please try again later.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
