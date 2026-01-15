import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormFieldComponent } from '../../../shared/components/ui-form-field/ui-form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, UiFormFieldComponent, UiButtonComponent, UiIconComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  protected loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected error = signal<string | null>(null);
  protected isLoading = signal(false);

  protected async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.error.set(null);

      try {
        await this.authService.login(this.loginForm.value);
        this.toastService.success('Welcome back!');
      } catch (err) {
        this.error.set('Invalid email or password');
        this.toastService.error('Login failed. Please check your credentials.');
        console.error(err);
      } finally {
        this.isLoading.set(false);
      }
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  protected async signInWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
    } catch (err) {
      this.toastService.error('Google sign-in failed. Please try again.');
      console.error(err);
    }
  }

  protected async signInWithMicrosoft() {
    try {
      await this.authService.signInWithMicrosoft();
    } catch (err) {
      this.toastService.error('Microsoft sign-in failed. Please try again.');
      console.error(err);
    }
  }
}
