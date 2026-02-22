import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ApplicationStatus } from '../data/recruitment-rebuild.models';
import { RecruitmentRebuildStore } from '../data/recruitment-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-recruitment-board-rebuild',
  imports: [DatePipe, UiBadgeComponent, UiButtonComponent],
  template: ''
})
export class RecruitmentBoardRebuildComponent implements OnInit {
  private readonly store = inject(RecruitmentRebuildStore);
  private readonly router = inject(Router);

  readonly jobs = this.store.jobs;
  readonly applications = this.store.applications;
  readonly boardLoading = this.store.boardLoading;
  readonly isSaving = this.store.isSaving;
  readonly canManage = this.store.canManage;
  readonly error = this.store.error;

  readonly selectedJobId = signal('');
  readonly selectedJobApplicationCount = computed(() =>
    this.applications().filter((application) =>
      this.selectedJobId() ? application.jobId === this.selectedJobId() : true
    ).length
  );

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    void this.store.loadBoard(this.selectedJobId() || undefined);
  }

  onJobFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.selectedJobId.set(target?.value ?? '');
    this.refresh();
  }

  async updateStatus(id: string, event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement | null;
    const status = target?.value;
    if (!this.isApplicationStatus(status)) {
      return;
    }
    await this.store.updateApplicationStatus(id, status);
  }

  viewJob(jobId: string): void {
    void this.router.navigate(['/recruitment/jobs', jobId]);
  }

  backToJobs(): void {
    void this.router.navigate(['/recruitment/jobs']);
  }

  statusVariant(status: ApplicationStatus): BadgeVariant {
    if (status === 'hired') {
      return 'success';
    }
    if (status === 'rejected') {
      return 'danger';
    }
    if (status === 'offer' || status === 'interview') {
      return 'warning';
    }
    return 'info';
  }

  private isApplicationStatus(value: string | undefined): value is ApplicationStatus {
    return (
      value === 'new' ||
      value === 'screening' ||
      value === 'interview' ||
      value === 'offer' ||
      value === 'hired' ||
      value === 'rejected'
    );
  }
}
