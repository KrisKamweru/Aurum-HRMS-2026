import { Component, signal } from '@angular/core';

interface PendingLinkRow {
  id: string;
  userName: string;
  userEmail: string;
  suggestedEmployee: string;
}

@Component({
  selector: 'app-user-linking-rebuild',
  standalone: true,
  template: `
    <main class="min-h-screen bg-stone-50 px-4 py-8 text-stone-900 dark:bg-[#0b0b0b] dark:text-stone-100 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Organization Rebuild</p>
          <h1 class="text-3xl font-semibold tracking-tight">User Linking</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Link user accounts to employee records before finalizing role-bound access.
          </p>
        </header>

        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-stone-700 dark:text-stone-300">Linked in this session</p>
            <span class="rounded-full bg-burgundy-100 px-3 py-1 text-xs font-semibold text-burgundy-700 dark:bg-burgundy-700/20 dark:text-burgundy-300">
              {{ linkedCount() }}
            </span>
          </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl">
          <table class="min-w-full text-left">
            <thead class="bg-stone-50 dark:bg-white/[0.03]">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">User</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Email</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Suggested Employee</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (candidate of pendingLinks(); track candidate.id) {
                <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                  <td class="px-4 py-3 text-sm font-medium text-stone-800 dark:text-stone-200">{{ candidate.userName }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ candidate.userEmail }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ candidate.suggestedEmployee }}</td>
                  <td class="px-4 py-3 text-right">
                    <button
                      type="button"
                      class="rounded-[10px] bg-burgundy-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-burgundy-600"
                      (click)="linkCandidate(candidate.id)"
                    >
                      Link
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-4 py-6 text-center text-sm text-stone-500 dark:text-stone-400">
                    No pending user links remaining.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      </div>
    </main>
  `
})
export class UserLinkingRebuildComponent {
  readonly pendingLinks = signal<PendingLinkRow[]>([
    {
      id: 'link-1',
      userName: 'Amina Hassan',
      userEmail: 'amina.hassan@aurum.dev',
      suggestedEmployee: 'EMP-0021'
    },
    {
      id: 'link-2',
      userName: 'James Doe',
      userEmail: 'james.doe@aurum.dev',
      suggestedEmployee: 'EMP-0044'
    }
  ]);

  readonly linkedCount = signal(0);

  linkCandidate(id: string): void {
    const hasCandidate = this.pendingLinks().some((row) => row.id === id);
    if (!hasCandidate) {
      return;
    }
    this.pendingLinks.update((rows) => rows.filter((row) => row.id !== id));
    this.linkedCount.update((count) => count + 1);
  }
}
