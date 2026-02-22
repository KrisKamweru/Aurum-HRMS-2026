import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: ''
})
export class LoginComponent {
  private readonly router = inject(Router);

  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthSessionService);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });
  readonly isSubmitting = signal(false);
  readonly error = signal<string | null>(null);

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


