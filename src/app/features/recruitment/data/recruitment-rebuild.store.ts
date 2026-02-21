import { Injectable, computed, inject, signal } from '@angular/core';
import {
  ApplicationStatus,
  CreateJobInput,
  EmploymentType,
  JobStatus,
  RebuildRecruitmentApplication,
  RebuildRecruitmentJob,
  RebuildRecruitmentReferenceOption,
  RebuildRecruitmentViewerContext,
  SubmitApplicationInput,
  UpdateJobInput
} from './recruitment-rebuild.models';
import { RecruitmentRebuildDataService } from './recruitment-rebuild.data.service';

interface JobDraft {
  title: string;
  description: string;
  departmentId?: string;
  locationId?: string;
  employmentType: string;
  salaryRange?: string;
  closingDate?: string;
  status: string;
}

interface ApplicationDraft {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class RecruitmentRebuildStore {
  private readonly data = inject(RecruitmentRebuildDataService);

  private readonly viewerState = signal<RebuildRecruitmentViewerContext>({ role: 'pending' });
  private readonly jobsState = signal<RebuildRecruitmentJob[]>([]);
  private readonly selectedJobState = signal<RebuildRecruitmentJob | null>(null);
  private readonly applicationsState = signal<RebuildRecruitmentApplication[]>([]);
  private readonly departmentState = signal<RebuildRecruitmentReferenceOption[]>([]);
  private readonly locationState = signal<RebuildRecruitmentReferenceOption[]>([]);

  private readonly listLoadingState = signal(false);
  private readonly detailLoadingState = signal(false);
  private readonly boardLoadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly referencesLoadedState = signal(false);

  readonly viewer = this.viewerState.asReadonly();
  readonly jobs = this.jobsState.asReadonly();
  readonly selectedJob = this.selectedJobState.asReadonly();
  readonly applications = this.applicationsState.asReadonly();
  readonly departments = this.departmentState.asReadonly();
  readonly locations = this.locationState.asReadonly();
  readonly listLoading = this.listLoadingState.asReadonly();
  readonly detailLoading = this.detailLoadingState.asReadonly();
  readonly boardLoading = this.boardLoadingState.asReadonly();
  readonly isSaving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly canManage = computed(() => {
    const role = this.viewer().role;
    return role === 'super_admin' || role === 'admin' || role === 'hr_manager' || role === 'manager';
  });

  readonly openJobCount = computed(() => this.jobs().filter((job) => job.status === 'open').length);
  readonly closedJobCount = computed(() => this.jobs().filter((job) => job.status === 'closed').length);

  async loadJobsView(): Promise<void> {
    this.listLoadingState.set(true);
    this.clearError();
    try {
      await this.ensureViewerAndReferences();
      this.jobsState.set(await this.data.listJobs());
    } catch (error: unknown) {
      this.setError(error, 'Unable to load recruitment jobs.');
    } finally {
      this.listLoadingState.set(false);
    }
  }

  async loadJobDetail(id: string): Promise<void> {
    const jobId = id.trim();
    if (!jobId) {
      this.errorState.set('Job id is required.');
      return;
    }
    this.detailLoadingState.set(true);
    this.clearError();
    try {
      await this.ensureViewerAndReferences();
      this.selectedJobState.set(await this.data.getJob(jobId));
    } catch (error: unknown) {
      this.selectedJobState.set(null);
      this.setError(error, 'Unable to load job detail.');
    } finally {
      this.detailLoadingState.set(false);
    }
  }

  async loadBoard(jobId?: string): Promise<void> {
    this.boardLoadingState.set(true);
    this.clearError();
    try {
      await this.ensureViewerAndReferences();
      const [jobs, applications] = await Promise.all([this.data.listJobs(), this.data.listApplications(jobId)]);
      this.jobsState.set(jobs);
      this.applicationsState.set(applications);
    } catch (error: unknown) {
      this.setError(error, 'Unable to load application board.');
    } finally {
      this.boardLoadingState.set(false);
    }
  }

  async createJob(payload: JobDraft): Promise<string | null> {
    const input = this.normalizeJobDraft(payload);
    if (!input) {
      return null;
    }
    this.savingState.set(true);
    this.clearError();
    try {
      const id = await this.data.createJob(input);
      await this.loadJobsView();
      return id || null;
    } catch (error: unknown) {
      this.setError(error, 'Unable to create job.');
      return null;
    } finally {
      this.savingState.set(false);
    }
  }

  async updateJob(payload: JobDraft & { id: string }): Promise<boolean> {
    const id = payload.id.trim();
    if (!id) {
      this.errorState.set('Job id is required.');
      return false;
    }
    const normalized = this.normalizeJobDraft(payload);
    if (!normalized) {
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      const updateInput: UpdateJobInput = {
        id,
        ...normalized
      };
      await this.data.updateJob(updateInput);
      await this.loadJobsView();
      if (this.selectedJob()?.id === id) {
        await this.loadJobDetail(id);
      }
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to update job.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async submitApplication(jobId: string, payload: ApplicationDraft): Promise<boolean> {
    const targetJobId = jobId.trim();
    if (!targetJobId) {
      this.errorState.set('Job id is required.');
      return false;
    }
    const input = this.normalizeApplicationDraft(targetJobId, payload);
    if (!input) {
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.submitApplication(input);
      await this.loadBoard(targetJobId);
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to submit application.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async updateApplicationStatus(id: string, status: ApplicationStatus): Promise<boolean> {
    const applicationId = id.trim();
    if (!applicationId) {
      this.errorState.set('Application id is required.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.updateApplicationStatus(applicationId, status);
      this.applicationsState.update((rows) =>
        rows.map((row) => (row.id === applicationId ? { ...row, status } : row))
      );
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to update application status.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private async ensureViewerAndReferences(): Promise<void> {
    if (this.referencesLoadedState()) {
      return;
    }
    const [viewer, departments, locations] = await Promise.all([
      this.data.getViewerContext(),
      this.data.listDepartments(),
      this.data.listLocations()
    ]);
    this.viewerState.set(viewer);
    this.departmentState.set(departments);
    this.locationState.set(locations);
    this.referencesLoadedState.set(true);
  }

  private normalizeJobDraft(payload: JobDraft): CreateJobInput | null {
    const title = payload.title.trim();
    const description = payload.description.trim();
    const status = this.normalizeStatus(payload.status);
    const employmentType = this.normalizeEmploymentType(payload.employmentType);
    const departmentId = payload.departmentId?.trim();
    const locationId = payload.locationId?.trim();
    const closingDate = payload.closingDate?.trim();

    if (!title || !description) {
      this.errorState.set('Title and description are required.');
      return null;
    }
    if (!status || !employmentType) {
      this.errorState.set('Select a valid status and employment type.');
      return null;
    }
    if (!departmentId) {
      this.errorState.set('Department is required.');
      return null;
    }
    if (closingDate && Number.isNaN(Date.parse(closingDate))) {
      this.errorState.set('Closing date must be a valid date.');
      return null;
    }

    return {
      title,
      description,
      departmentId,
      locationId: locationId && locationId.length > 0 ? locationId : undefined,
      employmentType,
      salaryRange: payload.salaryRange?.trim(),
      closingDate: closingDate && closingDate.length > 0 ? closingDate : undefined,
      status
    };
  }

  private normalizeApplicationDraft(jobId: string, payload: ApplicationDraft): SubmitApplicationInput | null {
    const firstName = payload.firstName.trim();
    const lastName = payload.lastName.trim();
    const email = payload.email.trim().toLowerCase();
    if (!firstName || !lastName || !email) {
      this.errorState.set('First name, last name, and email are required.');
      return null;
    }
    if (!this.isEmail(email)) {
      this.errorState.set('Email address is not valid.');
      return null;
    }

    return {
      jobId,
      firstName,
      lastName,
      email,
      phone: payload.phone?.trim(),
      notes: payload.notes?.trim()
    };
  }

  private normalizeStatus(value: string): JobStatus | null {
    if (value === 'draft' || value === 'open' || value === 'closed') {
      return value;
    }
    return null;
  }

  private normalizeEmploymentType(value: string): EmploymentType | null {
    if (
      value === 'full_time' ||
      value === 'part_time' ||
      value === 'contract' ||
      value === 'intern' ||
      value === 'temporary'
    ) {
      return value;
    }
    return null;
  }

  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private setError(error: unknown, fallback: string): void {
    if (error instanceof Error && error.message.trim().length > 0) {
      this.errorState.set(error.message);
      return;
    }
    this.errorState.set(fallback);
  }
}
