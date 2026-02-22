import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { SessionUser } from '../../../core/auth/auth.types';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let user: ReturnType<typeof signal<SessionUser | null>>;
  let loading: ReturnType<typeof signal<boolean>>;
  const registerWithPassword = vi.fn();
  const signInWithProvider = vi.fn();

  beforeEach(async () => {
    user = signal<SessionUser | null>(null);
    loading = signal(false);
    registerWithPassword.mockReset();
    signInWithProvider.mockReset();
    registerWithPassword.mockResolvedValue(true);
    signInWithProvider.mockResolvedValue(false);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            user: user.asReadonly(),
            isLoading: loading.asReadonly(),
            registerWithPassword,
            signInWithProvider
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('submits valid registration and routes pending users to onboarding hub', async () => {
    user.set({ id: 'u1', name: 'New User', role: 'pending', email: 'new@aurum.dev' });
    component.registerForm.setValue({
      name: 'New User',
      email: 'new@aurum.dev',
      password: 'secret123'
    });

    await component.submit();

    expect(registerWithPassword).toHaveBeenCalledWith('New User', 'new@aurum.dev', 'secret123');
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/pending']);
  });

  it('routes active users to dashboard after successful registration', async () => {
    user.set({ id: 'u2', name: 'HR Manager', role: 'hr_manager', email: 'hr@aurum.dev' });
    component.registerForm.setValue({
      name: 'HR Manager',
      email: 'hr@aurum.dev',
      password: 'secret123'
    });

    await component.submit();

    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('does not submit invalid registration forms', async () => {
    component.registerForm.setValue({
      name: '',
      email: 'invalid-email',
      password: 'short'
    });

    await component.submit();

    expect(registerWithPassword).not.toHaveBeenCalled();
  });

  it('shows an error when registration fails', async () => {
    component.registerForm.setValue({
      name: 'New User',
      email: 'new@aurum.dev',
      password: 'secret123'
    });
    registerWithPassword.mockResolvedValue(false);

    await component.submit();

    expect(component.error()).toContain('Unable to create account');
  });

  it('starts provider sign-in from the social actions', async () => {
    await component.startProviderSignIn('microsoft');

    expect(signInWithProvider).toHaveBeenCalledWith('microsoft');
  });
});
