import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { JobStatus } from '../data/recruitment-rebuild.models';
import { RecruitmentRebuildStore } from '../data/recruitment-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-recruitment-job-detail-rebuild',
  imports: [DatePipe, UiBadgeComponent, UiButtonComponent, UiModalComponent, DynamicFormComponent],
  template: ''
})
export class RecruitmentJobDetailRebuildComponent implements OnInit {
  private readonly store = inject(RecruitmentRebuildStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly detailLoading = this.store.detailLoading;
  readonly isSaving = this.store.isSaving;
  readonly error = this.store.error;
  readonly job = this.store.selectedJob;
  readonly canManage = this.store.canManage;

  readonly jobId = signal('');
  readonly isApplicationModalOpen = signal(false);
  readonly applicationInitialValues = signal<Record<string, unknown>>({});

  readonly applicationSections: FormSectionConfig[] = [
    {
      id: 'identity',
      title: 'Applicant',
      description: 'Provide your contact details.',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'notes',
      title: 'Notes',
      description: 'Optional context for reviewers.',
      columns: { base: 1, md: 1, lg: 1 }
    }
  ];

  readonly applicationSteps: FormStepConfig[] = [
    { id: 'app-step-1', title: 'Identity', sectionIds: ['identity'] },
    { id: 'app-step-2', title: 'Notes', sectionIds: ['notes'] }
  ];

  readonly applicationFields: FieldConfig[] = [
    { name: 'firstName', label: 'First Name', type: 'text', sectionId: 'identity', required: true },
    { name: 'lastName', label: 'Last Name', type: 'text', sectionId: 'identity', required: true },
    { name: 'email', label: 'Email', type: 'email', sectionId: 'identity', required: true, colSpan: 2 },
    { name: 'phone', label: 'Phone', type: 'text', sectionId: 'identity', required: false, colSpan: 2 },
    { name: 'notes', label: 'Notes', type: 'textarea', sectionId: 'notes', required: false }
  ];

  ngOnInit(): void {
    this.jobId.set(this.route.snapshot.paramMap.get('id') ?? '');
    void this.reload();
  }

  async reload(): Promise<void> {
    await this.store.loadJobDetail(this.jobId());
  }

  openApplicationModal(): void {
    this.applicationInitialValues.set({});
    this.isApplicationModalOpen.set(true);
    this.store.clearError();
  }

  closeApplicationModal(): void {
    this.isApplicationModalOpen.set(false);
  }

  async submitApplication(payload: Record<string, unknown>): Promise<void> {
    const success = await this.store.submitApplication(this.jobId(), {
      firstName: this.readText(payload, 'firstName'),
      lastName: this.readText(payload, 'lastName'),
      email: this.readText(payload, 'email'),
      phone: this.readText(payload, 'phone'),
      notes: this.readText(payload, 'notes')
    });
    if (success) {
      this.closeApplicationModal();
    }
  }

  backToJobs(): void {
    void this.router.navigate(['/recruitment/jobs']);
  }

  editJob(): void {
    const id = this.jobId();
    if (!id) {
      return;
    }
    void this.router.navigate(['/recruitment/jobs', id, 'edit']);
  }

  statusVariant(status: JobStatus): BadgeVariant {
    if (status === 'open') {
      return 'success';
    }
    if (status === 'closed') {
      return 'danger';
    }
    return 'neutral';
  }

  employmentTypeLabel(type: string): string {
    return type
      .split('_')
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  }

  private readText(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];
    return typeof value === 'string' ? value : '';
  }
}
