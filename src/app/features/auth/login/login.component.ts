import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { AppRole } from '../../../core/auth/auth.types';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <main class="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div class="mx-auto w-full max-w-3xl space-y-8">
        <h1 class="text-4xl font-semibold tracking-tight">Sign In</h1>
        <p class="text-slate-300">
          Rebuild auth bootstrap is active. Choose a role to continue and validate guarded routes while modules are rebuilt.
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          <button class="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-left hover:border-slate-400" (click)="signIn('super_admin')">Continue as Super Admin</button>
          <button class="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-left hover:border-slate-400" (click)="signIn('admin')">Continue as Admin</button>
          <button class="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-left hover:border-slate-400" (click)="signIn('hr_manager')">Continue as HR Manager</button>
          <button class="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-left hover:border-slate-400" (click)="signIn('manager')">Continue as Manager</button>
          <button class="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-left hover:border-slate-400" (click)="signIn('employee')">Continue as Employee</button>
          <button class="rounded-lg border border-amber-600 bg-slate-900 px-4 py-3 text-left hover:border-amber-400" (click)="signIn('pending')">Continue as Pending User</button>
        </div>
      </div>
    </main>
  `
})
export class LoginComponent {
  constructor(
    private readonly auth: AuthSessionService,
    private readonly router: Router
  ) {}

  signIn(role: AppRole): void {
    this.auth.signInAs(role);
    if (role === 'pending') {
      void this.router.navigate(['/pending']);
      return;
    }
    void this.router.navigate(['/dashboard']);
  }
}
