import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { SessionUser } from '../../../core/auth/auth.types';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let user: ReturnType<typeof signal<SessionUser | null>>;
  let loading: ReturnType<typeof signal<boolean>>;
  const loginWithPassword = vi.fn();
  const navigate = vi.fn();

  beforeEach(async () => {
    user = signal<SessionUser | null>(null);
    loading = signal(false);
    loginWithPassword.mockClear();
    navigate.mockClear();
    loginWithPassword.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {
          provide: AuthSessionService,
          useValue: {
            user: user.asReadonly(),
            isLoading: loading.asReadonly(),
            loginWithPassword
          }
        },
        {
          provide: Router,
          useValue: {
            navigate
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  it('submits email/password and navigates to dashboard for active users', async () => {
    user.set({ id: 'user-a', name: 'Admin', role: 'admin' });
    fixture.componentInstance.loginForm.setValue({
      email: 'admin@aurum.dev',
      password: 'secret'
    });

    await fixture.componentInstance.submit();

    expect(loginWithPassword).toHaveBeenCalledWith('admin@aurum.dev', 'secret');
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('routes pending users to pending page after successful sign in', async () => {
    user.set({ id: 'user-p', name: 'Pending', role: 'pending' });
    fixture.componentInstance.loginForm.setValue({
      email: 'pending@aurum.dev',
      password: 'secret'
    });

    await fixture.componentInstance.submit();

    expect(navigate).toHaveBeenCalledWith(['/pending']);
  });

  it('does not submit invalid forms', async () => {
    fixture.componentInstance.loginForm.setValue({
      email: '',
      password: ''
    });

    await fixture.componentInstance.submit();

    expect(loginWithPassword).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
