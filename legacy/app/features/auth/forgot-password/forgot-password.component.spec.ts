import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let loading: ReturnType<typeof signal<boolean>>;
  const requestPasswordReset = vi.fn();

  beforeEach(async () => {
    loading = signal(false);
    requestPasswordReset.mockReset();
    requestPasswordReset.mockResolvedValue({
      status: 'unsupported',
      message: 'Password reset is not yet available in the rebuilt auth flow.'
    });

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            isLoading: loading.asReadonly(),
            requestPasswordReset
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not submit invalid email input', async () => {
    component.forgotPasswordForm.setValue({ email: 'invalid' });

    await component.submit();

    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it('shows unsupported-state guidance when reset flow is unavailable', async () => {
    component.forgotPasswordForm.setValue({ email: 'user@aurum.dev' });

    await component.submit();

    expect(requestPasswordReset).toHaveBeenCalledWith('user@aurum.dev');
    expect(component.requestResult()?.status).toBe('unsupported');
    expect(component.error()).toBeNull();
  });

  it('handles future sent-state responses without error', async () => {
    requestPasswordReset.mockResolvedValue({
      status: 'sent',
      message: 'Password reset email sent.'
    });
    component.forgotPasswordForm.setValue({ email: 'user@aurum.dev' });

    await component.submit();

    expect(component.requestResult()).toEqual({
      status: 'sent',
      message: 'Password reset email sent.'
    });
    expect(component.error()).toBeNull();
  });
});
