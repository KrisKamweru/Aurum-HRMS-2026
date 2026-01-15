import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormFieldComponent } from '../../../shared/components/ui-form-field/ui-form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { mapAuthError } from '../../../core/auth/auth-error.handler';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, UiFormFieldComponent, UiButtonComponent, UiIconComponent],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  protected registerForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected error = signal<string | null>(null);
  protected isLoading = signal(false);

  protected async onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.error.set(null);

      try {
        await this.authService.register(this.registerForm.value);
        this.toastService.success('Account created successfully!');
      } catch (err: unknown) {
        const errorMessage = mapAuthError(err);
        this.error.set(errorMessage);
        this.toastService.error(errorMessage);
        console.error(err);
      } finally {
        this.isLoading.set(false);
      }
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  protected async signInWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
    } catch (err) {
      this.toastService.error(mapAuthError(err));
      console.error(err);
    }
  }

  protected async signInWithMicrosoft() {
    try {
      await this.authService.signInWithMicrosoft();
    } catch (err) {
      this.toastService.error(mapAuthError(err));
      console.error(err);
    }
  }
}
