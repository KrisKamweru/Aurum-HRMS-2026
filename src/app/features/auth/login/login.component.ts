import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { AppRole } from '../../../core/auth/auth.types';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Authentication</p>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Sign In</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Rebuild auth bootstrap is active. Choose a role to continue and validate guarded routes while modules are rebuilt.
          </p>
        </header>

        <section class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-6 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/5 dark:backdrop-blur-xl">
          <div class="grid gap-3 sm:grid-cols-2">
            <button class="rounded-[10px] border border-stone-200 bg-white px-4 py-3 text-left text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-200 dark:hover:bg-white/10" (click)="signIn('super_admin')">Continue as Super Admin</button>
            <button class="rounded-[10px] border border-stone-200 bg-white px-4 py-3 text-left text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-200 dark:hover:bg-white/10" (click)="signIn('admin')">Continue as Admin</button>
            <button class="rounded-[10px] border border-stone-200 bg-white px-4 py-3 text-left text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-200 dark:hover:bg-white/10" (click)="signIn('hr_manager')">Continue as HR Manager</button>
            <button class="rounded-[10px] border border-stone-200 bg-white px-4 py-3 text-left text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-200 dark:hover:bg-white/10" (click)="signIn('manager')">Continue as Manager</button>
            <button class="rounded-[10px] border border-stone-200 bg-white px-4 py-3 text-left text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-200 dark:hover:bg-white/10" (click)="signIn('employee')">Continue as Employee</button>
            <button class="rounded-[10px] border border-amber-400/70 bg-amber-50 px-4 py-3 text-left text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15" (click)="signIn('pending')">Continue as Pending User</button>
          </div>
        </section>
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
