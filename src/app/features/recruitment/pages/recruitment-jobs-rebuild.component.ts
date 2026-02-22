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
  template: ''
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
