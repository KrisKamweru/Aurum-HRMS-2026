import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { CoreHrRecordType } from '../data/core-hr-rebuild.models';
import { CoreHrRebuildStore } from '../data/core-hr-rebuild.store';

interface CoreHrModuleCard {
  type: CoreHrRecordType;
  title: string;
  description: string;
  route: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-core-hr-rebuild',
  imports: [UiBadgeComponent, UiButtonComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Core HR</h1>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Lifecycle events baseline for promotions, transfers, employee relations, and exits.
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <ui-badge variant="warning" size="sm" [rounded]="true">
              Pending Resignations {{ pendingResignations() }}
            </ui-badge>
            <ui-badge variant="neutral" size="sm" [rounded]="true">
              Employees {{ employees().length }}
            </ui-badge>
          </div>
        </div>
        <ui-button variant="secondary" size="sm" [disabled]="isLoading()" (onClick)="refresh()">Refresh</ui-button>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" [disabled]="isLoading()" (onClick)="refresh()">Retry</ui-button>
        </section>
      }

      @if (isLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-4 w-48 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-28 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else {
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          @for (module of modules; track module.type) {
            <article class="rounded-2xl border border-white/[0.55] bg-white/[0.82] p-4 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.05]">
              <div class="mb-3 flex items-start justify-between gap-2">
                <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">{{ module.title }}</h2>
                <ui-badge variant="neutral" size="sm" [rounded]="true">{{ count(module.type) }}</ui-badge>
              </div>
              <p class="mb-4 text-sm text-stone-600 dark:text-stone-400">{{ module.description }}</p>
              <ui-button variant="primary" size="sm" (onClick)="openModule(module.route)">Open</ui-button>
            </article>
          }
        </section>
      }
    </main>
  `
})
export class CoreHrRebuildComponent implements OnInit {
  private readonly store = inject(CoreHrRebuildStore);
  private readonly router = inject(Router);

  readonly employees = this.store.employees;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly pendingResignations = this.store.pendingResignations;
  readonly recordCounts = this.store.recordCounts;

  readonly modules: CoreHrModuleCard[] = [
    {
      type: 'promotions',
      title: 'Promotions',
      description: 'Role advancement and compensation progression records.',
      route: '/core-hr/promotions'
    },
    {
      type: 'transfers',
      title: 'Transfers',
      description: 'Department and location movement records.',
      route: '/core-hr/transfers'
    },
    {
      type: 'awards',
      title: 'Awards',
      description: 'Recognition events and discretionary rewards.',
      route: '/core-hr/awards'
    },
    {
      type: 'warnings',
      title: 'Warnings',
      description: 'Disciplinary notices with severity tracking.',
      route: '/core-hr/warnings'
    },
    {
      type: 'resignations',
      title: 'Resignations',
      description: 'Voluntary exits and approval workflow tracking.',
      route: '/core-hr/resignations'
    },
    {
      type: 'terminations',
      title: 'Terminations',
      description: 'Involuntary and voluntary termination records.',
      route: '/core-hr/terminations'
    },
    {
      type: 'complaints',
      title: 'Complaints',
      description: 'Employee relations cases and grievance intake.',
      route: '/core-hr/complaints'
    },
    {
      type: 'travel',
      title: 'Travel',
      description: 'Business travel requests and budget visibility.',
      route: '/core-hr/travel'
    }
  ];

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    void this.store.loadOverview();
  }

  openModule(route: string): void {
    void this.router.navigate([route]);
  }

  count(type: CoreHrRecordType): number {
    return this.recordCounts()[type];
  }
}
