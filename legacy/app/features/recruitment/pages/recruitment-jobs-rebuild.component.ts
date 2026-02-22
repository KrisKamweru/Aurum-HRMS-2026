import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { EmploymentType, JobStatus } from '../data/recruitment-rebuild.models';
import { RecruitmentRebuildStore } from '../data/recruitment-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-recruitment-jobs-rebuild',
  imports: [UiBadgeComponent, UiButtonComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Recruitment Jobs</h1>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Manage job postings and route applications into pipeline review.
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <ui-badge variant="success" size="sm" [rounded]="true">Open {{ openJobsCount() }}</ui-badge>
            <ui-badge variant="neutral" size="sm" [rounded]="true">Closed {{ closedJobCount() }}</ui-badge>
            <ui-badge variant="neutral" size="sm" [rounded]="true">Total {{ jobs().length }}</ui-badge>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <ui-button variant="secondary" size="sm" [disabled]="listLoading()" (onClick)="refresh()">Refresh</ui-button>
          <ui-button variant="outline" size="sm" [disabled]="!canManage()" (onClick)="openBoard()">Candidate Board</ui-button>
          <ui-button variant="primary" size="sm" [disabled]="!canManage()" (onClick)="createJob()">Post Job</ui-button>
        </div>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" [disabled]="listLoading()" (onClick)="refresh()">Retry</ui-button>
        </section>
      }

      @if (listLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-4 w-40 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-28 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else {
        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-white/8">
            <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Job Openings</p>
            <p class="text-xs text-stone-500 dark:text-stone-400">Pipeline ready</p>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-[#eeedf0] text-xs font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.02] dark:text-stone-400">
                <tr>
                  <th class="px-4 py-3">Title</th>
                  <th class="px-4 py-3">Department</th>
                  <th class="px-4 py-3">Location</th>
                  <th class="px-4 py-3">Type</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (jobs().length === 0) {
                  <tr>
                    <td colspan="6" class="px-4 py-5 text-center text-stone-500 dark:text-stone-400">No jobs posted yet.</td>
                  </tr>
                } @else {
                  @for (job of jobs(); track job.id) {
                    <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                      <td class="px-4 py-3">
                        <p class="font-semibold text-stone-800 dark:text-stone-100">{{ job.title }}</p>
                        <p class="text-xs text-stone-500 dark:text-stone-400">{{ job.salaryRange || 'Salary not disclosed' }}</p>
                      </td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ job.departmentName || 'Unassigned' }}</td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ job.locationName || 'Remote' }}</td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ employmentTypeLabel(job.employmentType) }}</td>
                      <td class="px-4 py-3">
                        <ui-badge size="sm" [rounded]="true" [variant]="jobStatusVariant(job.status)">{{ job.status }}</ui-badge>
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex justify-end gap-2">
                          <ui-button variant="outline" size="sm" (onClick)="openDetail(job.id)">View</ui-button>
                          @if (canManage()) {
                            <ui-button variant="secondary" size="sm" (onClick)="editJob(job.id)">Edit</ui-button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </main>
  `
})
export class RecruitmentJobsRebuildComponent implements OnInit {
  private readonly store = inject(RecruitmentRebuildStore);
  private readonly router = inject(Router);

  readonly jobs = this.store.jobs;
  readonly listLoading = this.store.listLoading;
  readonly error = this.store.error;
  readonly canManage = this.store.canManage;
  readonly openJobsCount = this.store.openJobCount;
  readonly closedJobCount = this.store.closedJobCount;
  readonly hasJobs = computed(() => this.jobs().length > 0);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    void this.store.loadJobsView();
  }

  createJob(): void {
    void this.router.navigate(['/recruitment/jobs/new']);
  }

  openDetail(id: string): void {
    void this.router.navigate(['/recruitment/jobs', id]);
  }

  editJob(id: string): void {
    void this.router.navigate(['/recruitment/jobs', id, 'edit']);
  }

  openBoard(): void {
    void this.router.navigate(['/recruitment/board']);
  }

  jobStatusVariant(status: JobStatus): BadgeVariant {
    if (status === 'open') {
      return 'success';
    }
    if (status === 'closed') {
      return 'danger';
    }
    return 'neutral';
  }

  employmentTypeLabel(type: EmploymentType): string {
    return type
      .split('_')
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  }
}
