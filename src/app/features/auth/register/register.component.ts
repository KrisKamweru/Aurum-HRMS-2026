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
  template: ''
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
