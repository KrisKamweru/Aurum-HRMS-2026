import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { EmployeesRebuildStore } from '../data/employees-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-employee-detail-rebuild',
  imports: [UiBadgeComponent, UiButtonComponent, DatePipe],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex items-center justify-between gap-3">
        <ui-button variant="outline" size="sm" (onClick)="goToList()">Back to Employees</ui-button>
        @if (currentEmployeeId()) {
          <p class="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Employee ID: {{ currentEmployeeId() }}
          </p>
        }
      </section>

      @if (routeError()) {
        <section class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          {{ routeError() }}
        </section>
      } @else if (detailLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-5 w-52 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-32 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else if (error()) {
        <section class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" (onClick)="reloadCurrentEmployee()">Retry</ui-button>
        </section>
      } @else if (employee()) {
        <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div class="space-y-2">
            <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">{{ employee()!.fullName }}</h1>
            <p class="text-[15px] text-stone-600 dark:text-stone-400">{{ employee()!.email }}</p>
            <div class="flex flex-wrap items-center gap-2">
              <ui-badge [rounded]="true" size="sm" [variant]="statusVariant(employee()!.status)">
                {{ employee()!.status }}
              </ui-badge>
              <ui-badge [rounded]="true" size="sm" variant="neutral">
                {{ employee()!.department || 'No department' }}
              </ui-badge>
              <ui-badge [rounded]="true" size="sm" variant="neutral">
                {{ employee()!.position || 'No designation' }}
              </ui-badge>
            </div>
          </div>
        </section>

        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Professional</h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Start Date</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ employee()!.startDate | date: 'mediumDate' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Manager</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ employee()!.managerName || 'Unassigned' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Location</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ employee()!.location || 'Unassigned' }}</dd>
              </div>
            </dl>
          </article>

          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Personal</h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Phone</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ employee()!.phone || 'Not set' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Gender</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ employee()!.gender || 'Not set' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">DOB</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">
                  @if (employee()!.dob) {
                    {{ employee()!.dob | date: 'mediumDate' }}
                  } @else {
                    Not set
                  }
                </dd>
              </div>
            </dl>
          </article>

          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Compensation</h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Base Salary</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ formattedSalary() }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Currency</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ employee()!.currency || 'Not set' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Pay Frequency</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ formattedPayFrequency() }}</dd>
              </div>
            </dl>
          </article>

          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04] md:col-span-2 xl:col-span-3">
            <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Profile Data Domains</h2>
            <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
              These counts track parity-critical employee detail modules while deeper interaction flows are rebuilt.
            </p>
            <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div class="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-white/8 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Emergency Contacts</p>
                <p class="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-100">{{ detailCollections().emergencyContacts }}</p>
              </div>
              <div class="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-white/8 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Banking</p>
                <p class="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-100">{{ detailCollections().bankingRecords }}</p>
              </div>
              <div class="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-white/8 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Education</p>
                <p class="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-100">{{ detailCollections().educationRecords }}</p>
              </div>
              <div class="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-white/8 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Documents</p>
                <p class="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-100">{{ detailCollections().documents }}</p>
              </div>
              <div class="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-white/8 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Statutory Profile</p>
                <p class="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-100">
                  {{ detailCollections().hasStatutoryInfo ? 'Present' : 'Missing' }}
                </p>
              </div>
            </div>
          </article>
        </section>
      }
    </main>
  `
})
export class EmployeeDetailRebuildComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(EmployeesRebuildStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly employee = this.store.selectedEmployee;
  readonly detailCollections = this.store.detailCollections;
  readonly detailLoading = this.store.detailLoading;
  readonly error = this.store.error;
  readonly routeError = signal<string | null>(null);
  readonly currentEmployeeId = signal<string | null>(null);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id')?.trim() ?? '';
      if (!id) {
        this.currentEmployeeId.set(null);
        this.routeError.set('Employee route is missing an id parameter.');
        return;
      }
      this.routeError.set(null);
      this.currentEmployeeId.set(id);
      void this.store.loadEmployeeDetail(id);
    });
  }

  goToList(): void {
    void this.router.navigate(['/employees']);
  }

  reloadCurrentEmployee(): void {
    const id = this.currentEmployeeId();
    if (!id) {
      return;
    }
    void this.store.loadEmployeeDetail(id);
  }

  statusVariant(status: string): BadgeVariant {
    const normalized = status.trim().toLowerCase();
    if (normalized === 'active') {
      return 'success';
    }
    if (normalized === 'on-leave') {
      return 'warning';
    }
    if (normalized === 'resigned' || normalized === 'terminated') {
      return 'danger';
    }
    return 'neutral';
  }

  formattedSalary(): string {
    const employee = this.employee();
    if (!employee || employee.baseSalary === undefined) {
      return 'Not set';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: employee.currency || 'USD'
    }).format(employee.baseSalary);
  }

  formattedPayFrequency(): string {
    const payFrequency = this.employee()?.payFrequency;
    if (payFrequency === 'monthly') {
      return 'Monthly';
    }
    if (payFrequency === 'bi_weekly') {
      return 'Bi-Weekly';
    }
    if (payFrequency === 'weekly') {
      return 'Weekly';
    }
    return 'Not set';
  }
}
