import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormFieldComponent } from '../../../shared/components/ui-form-field/ui-form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, UiFormFieldComponent, UiButtonComponent, UiIconComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

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
      } catch (err) {
        this.error.set('Invalid email or password');
        console.error(err);
      } finally {
        this.isLoading.set(false);
      }
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
