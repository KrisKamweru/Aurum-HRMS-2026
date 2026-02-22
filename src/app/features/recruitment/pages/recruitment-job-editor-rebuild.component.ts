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
  template: ''
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
