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
  template: ''
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
