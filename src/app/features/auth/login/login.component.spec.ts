import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  const signInAs = vi.fn();
  const navigate = vi.fn();

  beforeEach(async () => {
    signInAs.mockClear();
    navigate.mockClear();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {
          provide: AuthSessionService,
          useValue: {
            signInAs
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

  it('signs in selected role and navigates to dashboard', () => {
    fixture.componentInstance.signIn('admin');

    expect(signInAs).toHaveBeenCalledWith('admin');
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('routes pending role to pending page', () => {
    fixture.componentInstance.signIn('pending');

    expect(signInAs).toHaveBeenCalledWith('pending');
    expect(navigate).toHaveBeenCalledWith(['/pending']);
  });
});
