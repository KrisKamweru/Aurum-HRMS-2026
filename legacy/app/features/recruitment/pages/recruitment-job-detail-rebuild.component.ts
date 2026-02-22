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
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex items-start justify-between gap-4">
        <ui-button variant="secondary" size="sm" (onClick)="backToJobs()">Back to Jobs</ui-button>
        @if (canManage()) {
          <ui-button variant="outline" size="sm" [disabled]="!job()" (onClick)="editJob()">Edit</ui-button>
        }
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" [disabled]="detailLoading()" (onClick)="reload()">Retry</ui-button>
        </section>
      }

      @if (detailLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-4 w-40 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-28 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else if (!job()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <p class="text-lg font-semibold text-stone-800 dark:text-stone-100">Job not found</p>
          <ui-button class="mt-4" variant="secondary" size="sm" (onClick)="backToJobs()">Back</ui-button>
        </section>
      } @else {
        <section class="rounded-2xl border border-white/[0.55] bg-white/[0.82] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.05]">
          <div class="mb-4 flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-bold text-stone-900 dark:text-stone-100">{{ job()!.title }}</h1>
            <ui-badge size="sm" [rounded]="true" [variant]="statusVariant(job()!.status)">{{ job()!.status }}</ui-badge>
          </div>
          <div class="mb-4 grid gap-3 text-sm text-stone-600 dark:text-stone-300 md:grid-cols-2">
            <p><span class="font-semibold">Department:</span> {{ job()!.departmentName || 'Unassigned' }}</p>
            <p><span class="font-semibold">Location:</span> {{ job()!.locationName || 'Remote' }}</p>
            <p><span class="font-semibold">Employment:</span> {{ employmentTypeLabel(job()!.employmentType) }}</p>
            <p><span class="font-semibold">Salary:</span> {{ job()!.salaryRange || 'Not disclosed' }}</p>
            <p><span class="font-semibold">Closing Date:</span> {{ job()!.closingDate || 'Open until filled' }}</p>
            <p><span class="font-semibold">Created:</span> {{ job()!.createdAt | date: 'MMM d, y' }}</p>
          </div>
          <div class="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-200">
            {{ job()!.description }}
          </div>
          <div class="mt-4">
            <ui-button variant="primary" size="sm" [disabled]="job()!.status !== 'open' || isSaving()" (onClick)="openApplicationModal()">
              Apply for Job
            </ui-button>
          </div>
        </section>
      }

      <ui-modal
        [isOpen]="isApplicationModalOpen()"
        (isOpenChange)="isApplicationModalOpen.set($event)"
        [canDismiss]="true"
        [hasFooter]="false"
        width="normal"
        title="Submit Application"
      >
        <app-dynamic-form
          container="modal"
          [fields]="applicationFields"
          [sections]="applicationSections"
          [steps]="applicationSteps"
          [initialValues]="applicationInitialValues()"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Submit Application"
          (cancel)="closeApplicationModal()"
          (formSubmit)="submitApplication($event)"
        />
      </ui-modal>
    </main>
  `
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
