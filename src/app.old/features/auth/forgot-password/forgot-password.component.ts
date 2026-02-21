import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormFieldComponent } from '../../../shared/components/ui-form-field/ui-form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { mapAuthError } from '../../../core/auth/auth-error.handler';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, UiFormFieldComponent, UiButtonComponent],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  protected forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected error = signal<string | null>(null);
  protected isLoading = signal(false);
  protected emailSent = signal(false);

  protected async onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading.set(true);
      this.error.set(null);

      try {
        const email = this.forgotPasswordForm.get('email')?.value;
        await this.authService.sendPasswordResetEmail(email!);
        this.emailSent.set(true);
        this.toastService.success('Password reset email sent!');
      } catch (err) {
        const errorMessage = mapAuthError(err);
        this.error.set(errorMessage);
        this.toastService.error(errorMessage);
        console.error(err);
      } finally {
        this.isLoading.set(false);
      }
    } else {
      this.forgotPasswordForm.markAllAsTouched();
    }
  }
}
