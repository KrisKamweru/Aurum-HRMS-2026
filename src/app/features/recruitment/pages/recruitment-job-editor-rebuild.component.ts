import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { RecruitmentRebuildStore } from '../data/recruitment-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-recruitment-job-editor-rebuild',
  imports: [UiButtonComponent, DynamicFormComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {{ isEditing() ? 'Edit Job' : 'Post Job' }}
          </h1>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            {{ isEditing() ? 'Update posting details and publication status.' : 'Create a recruitment posting with complete role details.' }}
          </p>
        </div>
        <ui-button variant="secondary" size="sm" (onClick)="backToJobs()">Back to Jobs</ui-button>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" [disabled]="isLoading()" (onClick)="reload()">Retry</ui-button>
        </section>
      }

      @if (isLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-4 w-40 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-28 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else {
        <app-dynamic-form
          [fields]="jobFields()"
          [sections]="jobSections"
          [steps]="jobSteps"
          [initialValues]="initialValues()"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Save Job"
          (cancel)="backToJobs()"
          (formSubmit)="save($event)"
        />
      }
    </main>
  `
})
export class RecruitmentJobEditorRebuildComponent implements OnInit {
  private readonly store = inject(RecruitmentRebuildStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly departments = this.store.departments;
  readonly locations = this.store.locations;
  readonly selectedJob = this.store.selectedJob;
  readonly error = this.store.error;
  readonly listLoading = this.store.listLoading;
  readonly detailLoading = this.store.detailLoading;
  readonly isSaving = this.store.isSaving;

  readonly jobId = signal<string | null>(null);
  readonly initialValues = signal<Record<string, unknown>>({});

  readonly isEditing = computed(() => this.jobId() !== null);
  readonly isLoading = computed(() => this.listLoading() || this.detailLoading());

  readonly jobSections: FormSectionConfig[] = [
    {
      id: 'basics',
      title: 'Basics',
      description: 'Role identity and assignment',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'details',
      title: 'Details',
      description: 'Compensation and status',
      columns: { base: 1, md: 2, lg: 2 }
    }
  ];

  readonly jobSteps: FormStepConfig[] = [
    { id: 'job-step-1', title: 'Basics', sectionIds: ['basics'] },
    { id: 'job-step-2', title: 'Details', sectionIds: ['details'] }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.jobId.set(id);
    void this.reload();
  }

  async reload(): Promise<void> {
    await this.store.loadJobsView();
    if (!this.jobId()) {
      this.initialValues.set({
        employmentType: 'full_time',
        status: 'draft'
      });
      return;
    }

    await this.store.loadJobDetail(this.jobId() ?? '');
    const job = this.selectedJob();
    if (!job) {
      return;
    }
    this.initialValues.set({
      title: job.title,
      description: job.description,
      departmentId: job.departmentId ?? '',
      locationId: job.locationId ?? '',
      employmentType: job.employmentType,
      salaryRange: job.salaryRange,
      closingDate: job.closingDate,
      status: job.status
    });
  }

  jobFields(): FieldConfig[] {
    return [
      { name: 'title', label: 'Job Title', type: 'text', sectionId: 'basics', required: true, colSpan: 2 },
      {
        name: 'departmentId',
        label: 'Department',
        type: 'select',
        sectionId: 'basics',
        required: true,
        options: this.departments().map((department) => ({ label: department.label, value: department.id }))
      },
      {
        name: 'locationId',
        label: 'Location',
        type: 'select',
        sectionId: 'basics',
        required: false,
        options: this.locations().map((location) => ({ label: location.label, value: location.id }))
      },
      {
        name: 'employmentType',
        label: 'Employment Type',
        type: 'select',
        sectionId: 'details',
        required: true,
        options: [
          { label: 'Full Time', value: 'full_time' },
          { label: 'Part Time', value: 'part_time' },
          { label: 'Contract', value: 'contract' },
          { label: 'Intern', value: 'intern' },
          { label: 'Temporary', value: 'temporary' }
        ]
      },
      { name: 'salaryRange', label: 'Salary Range', type: 'text', sectionId: 'details', required: false },
      { name: 'closingDate', label: 'Closing Date', type: 'date', sectionId: 'details', required: false },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        sectionId: 'details',
        required: true,
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' }
        ]
      },
      { name: 'description', label: 'Description', type: 'textarea', sectionId: 'details', required: true, colSpan: 2 }
    ];
  }

  async save(payload: Record<string, unknown>): Promise<void> {
    const draft = {
      title: this.readText(payload, 'title'),
      description: this.readText(payload, 'description'),
      departmentId: this.readText(payload, 'departmentId'),
      locationId: this.readText(payload, 'locationId'),
      employmentType: this.readText(payload, 'employmentType'),
      salaryRange: this.readText(payload, 'salaryRange'),
      closingDate: this.readText(payload, 'closingDate'),
      status: this.readText(payload, 'status')
    };

    if (this.isEditing()) {
      const success = await this.store.updateJob({ id: this.jobId() ?? '', ...draft });
      if (success) {
        this.backToJobs();
      }
      return;
    }

    const jobId = await this.store.createJob(draft);
    if (jobId) {
      void this.router.navigate(['/recruitment/jobs', jobId]);
    }
  }

  backToJobs(): void {
    void this.router.navigate(['/recruitment/jobs']);
  }

  private readText(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];
    return typeof value === 'string' ? value : '';
  }
}
