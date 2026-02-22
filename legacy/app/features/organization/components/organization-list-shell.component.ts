import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-organization-list-shell',
  template: `
    <div class="mx-auto w-full max-w-5xl space-y-8">
      <header class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">{{ eyebrow() }}</p>
        <h1 class="text-3xl font-semibold tracking-tight">{{ title() }}</h1>
        <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
          {{ description() }}
        </p>
      </header>

      <ng-content select="[org-list-page-state]" />

      <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-2">
            <p class="text-sm text-stone-600 dark:text-stone-300">{{ actionMessage() }}</p>
            <div data-testid="org-list-shell-status" class="flex flex-wrap items-center gap-2">
              <ng-content select="[org-list-status]" />
            </div>
          </div>
          <div data-testid="org-list-shell-actions" class="flex items-center gap-2">
            <ng-content select="[org-list-toolbar-actions]" />
          </div>
        </div>
      </section>

      <ng-content select="[org-list-table-content]" />
    </div>
  `
})
export class OrganizationListShellComponent {
  readonly eyebrow = input('Organization Rebuild');
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly actionMessage = input.required<string>();
}


