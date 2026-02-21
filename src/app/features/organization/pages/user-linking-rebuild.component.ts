import { Component, OnInit, inject } from '@angular/core';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';

@Component({
  selector: 'app-user-linking-rebuild',
  standalone: true,
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Organization Rebuild</p>
          <h1 class="text-3xl font-semibold tracking-tight">User Linking</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Link user accounts to unlinked employee records using live Convex data.
          </p>
        </header>

        @if (error()) {
          <section class="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
            {{ error() }}
          </section>
        }

        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm font-medium text-stone-700 dark:text-stone-300">Linked in this session</p>
            <div class="flex items-center gap-2">
              <span class="rounded-full bg-burgundy-100 px-3 py-1 text-xs font-semibold text-burgundy-700 dark:bg-burgundy-700/20 dark:text-burgundy-300">
                {{ linkedCount() }}
              </span>
              <button
                type="button"
                class="rounded-[10px] border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/8 dark:text-stone-200 dark:hover:bg-white/10"
                [disabled]="userLinkingLoading() || isSaving()"
                (click)="refresh()"
              >
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="overflow-x-auto">
          <table class="min-w-full text-left">
            <thead class="bg-stone-50 dark:bg-white/[0.03]">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">User</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Email</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Suggested Employee</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Selected Employee</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (userLinkingLoading() && pendingLinks().length === 0) {
                <tr>
                  <td colspan="5" class="px-4 py-8 text-center text-sm text-stone-500 dark:text-stone-400">Loading pending links...</td>
                </tr>
              }
              @for (candidate of pendingLinks(); track candidate.id) {
                <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                  <td class="px-4 py-3 text-sm font-medium text-stone-800 dark:text-stone-200">{{ candidate.name }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ candidate.email }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ selectedEmployeeLabel(candidate.id) }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">
                    <select
                      class="w-full min-w-52 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100"
                      [value]="selectedEmployeeId(candidate.id)"
                      [disabled]="isSaving() || userLinkingLoading() || unlinkedEmployees().length === 0"
                      (change)="onEmployeeSelectionChange(candidate.id, $event)"
                    >
                      <option value="">Select an employee</option>
                      @for (employee of unlinkedEmployees(); track employee.id) {
                        <option [value]="employee.id">{{ employee.firstName }} {{ employee.lastName }} ({{ employee.email }})</option>
                      }
                    </select>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button
                      type="button"
                      class="rounded-[10px] bg-burgundy-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-burgundy-600"
                      [disabled]="!selectedEmployeeId(candidate.id) || isSaving() || userLinkingLoading()"
                      (click)="linkCandidate(candidate.id)"
                    >
                      Link
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-4 py-6 text-center text-sm text-stone-500 dark:text-stone-400">
                    No pending user links remaining.
                  </td>
                </tr>
              }
            </tbody>
          </table>
          </div>
        </section>
      </div>
    </main>
  `
})
export class UserLinkingRebuildComponent implements OnInit {
  private readonly store = inject(OrganizationRebuildStore);

  readonly pendingLinks = this.store.pendingUserLinks;
  readonly unlinkedEmployees = this.store.unlinkedEmployees;
  readonly linkedCount = this.store.linkedCount;
  readonly userLinkingLoading = this.store.userLinkingLoading;
  readonly isSaving = this.store.isSaving;
  readonly error = this.store.error;

  ngOnInit(): void {
    void this.store.loadUserLinkingData();
  }

  refresh(): void {
    void this.store.loadUserLinkingData();
  }

  selectedEmployeeId(userId: string): string {
    return this.store.selectedEmployeeForUser(userId) ?? '';
  }

  selectedEmployeeLabel(userId: string): string {
    const selected = this.selectedEmployeeId(userId);
    if (!selected) {
      return 'No suggestion';
    }
    const employee = this.unlinkedEmployees().find((row) => row.id === selected);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'No suggestion';
  }

  onEmployeeSelectionChange(userId: string, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    this.store.setSelectedEmployeeForUser(userId, target.value);
  }

  linkCandidate(id: string): void {
    void this.store.linkUserToEmployee(id);
  }
}
