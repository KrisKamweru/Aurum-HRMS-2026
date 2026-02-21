import { Injectable, inject } from '@angular/core';
import { api } from '../../../../../convex/_generated/api';
import { Id, TableNames } from '../../../../../convex/_generated/dataModel';
import { AppRole } from '../../../core/auth/auth.types';
import { ConvexClientService } from '../../../core/services/convex-client.service';
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

@Injectable({ providedIn: 'root' })
export class RecruitmentRebuildDataService {
  private readonly convexClient = inject(ConvexClientService);
  private readonly convex = this.convexClient.getHttpClient();

  async getViewerContext(): Promise<RebuildRecruitmentViewerContext> {
    const viewer = await this.convex.query(api.users.viewer, {});
    if (!viewer || typeof viewer !== 'object') {
      return { role: 'pending' };
    }
    const record = viewer as Record<string, unknown>;
    return {
      role: this.normalizeRole(record['role']),
      employeeId: typeof record['employeeId'] === 'string' ? record['employeeId'] : undefined
    };
  }

  async listJobs(status?: JobStatus): Promise<RebuildRecruitmentJob[]> {
    const rows = await this.convex.query(api.recruitment.listJobs, { status });
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapJob(row))
      .filter((row): row is RebuildRecruitmentJob => row !== null);
  }

  async getJob(id: string): Promise<RebuildRecruitmentJob | null> {
    const row = await this.convex.query(api.recruitment.getJob, { id: this.toId('jobs', id) });
    return this.mapJob(row);
  }

  async createJob(input: CreateJobInput): Promise<string> {
    const id = await this.convex.mutation(api.recruitment.createJob, {
      title: input.title,
      description: input.description,
      departmentId: input.departmentId ? this.toId('departments', input.departmentId) : undefined,
      locationId: input.locationId ? this.toId('locations', input.locationId) : undefined,
      employmentType: input.employmentType,
      salaryRange: this.normalizeOptionalText(input.salaryRange),
      closingDate: this.normalizeOptionalText(input.closingDate),
      status: input.status
    });
    return typeof id === 'string' ? id : '';
  }

  async updateJob(input: UpdateJobInput): Promise<void> {
    await this.convex.mutation(api.recruitment.updateJob, {
      id: this.toId('jobs', input.id),
      updates: {
        title: input.title,
        description: input.description,
        departmentId: input.departmentId ? this.toId('departments', input.departmentId) : undefined,
        locationId: input.locationId ? this.toId('locations', input.locationId) : undefined,
        employmentType: input.employmentType,
        salaryRange: this.normalizeOptionalText(input.salaryRange),
        closingDate: this.normalizeOptionalText(input.closingDate),
        status: input.status
      }
    });
  }

  async listApplications(jobId?: string): Promise<RebuildRecruitmentApplication[]> {
    const rows = await this.convex.query(api.recruitment.listApplications, {
      jobId: jobId ? this.toId('jobs', jobId) : undefined
    });
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapApplication(row))
      .filter((row): row is RebuildRecruitmentApplication => row !== null);
  }

  async submitApplication(input: SubmitApplicationInput): Promise<void> {
    await this.convex.mutation(api.recruitment.submitApplication, {
      jobId: this.toId('jobs', input.jobId),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: this.normalizeOptionalText(input.phone),
      notes: this.normalizeOptionalText(input.notes)
    });
  }

  async updateApplicationStatus(id: string, status: ApplicationStatus, rating?: number): Promise<void> {
    await this.convex.mutation(api.recruitment.updateApplicationStatus, {
      id: this.toId('applications', id),
      status,
      rating
    });
  }

  async listDepartments(): Promise<RebuildRecruitmentReferenceOption[]> {
    const rows = await this.convex.query(api.organization.listDepartments, {});
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapReference(row, 'name'))
      .filter((row): row is RebuildRecruitmentReferenceOption => row !== null);
  }

  async listLocations(): Promise<RebuildRecruitmentReferenceOption[]> {
    const rows = await this.convex.query(api.organization.listLocations, {});
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapReference(row, 'name'))
      .filter((row): row is RebuildRecruitmentReferenceOption => row !== null);
  }

  private mapJob(row: unknown): RebuildRecruitmentJob | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['title'] !== 'string' ||
      typeof value['description'] !== 'string' ||
      typeof value['createdAt'] !== 'string' ||
      !this.isJobStatus(value['status']) ||
      !this.isEmploymentType(value['employmentType'])
    ) {
      return null;
    }

    return {
      id: value['_id'],
      title: value['title'],
      description: value['description'],
      departmentId: typeof value['departmentId'] === 'string' ? value['departmentId'] : undefined,
      departmentName: typeof value['departmentName'] === 'string' ? value['departmentName'] : undefined,
      locationId: typeof value['locationId'] === 'string' ? value['locationId'] : undefined,
      locationName: typeof value['locationName'] === 'string' ? value['locationName'] : undefined,
      employmentType: value['employmentType'],
      salaryRange: typeof value['salaryRange'] === 'string' ? value['salaryRange'] : '',
      closingDate: typeof value['closingDate'] === 'string' ? value['closingDate'] : '',
      status: value['status'],
      createdAt: value['createdAt']
    };
  }

  private mapApplication(row: unknown): RebuildRecruitmentApplication | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['jobId'] !== 'string' ||
      typeof value['candidateName'] !== 'string' ||
      typeof value['jobTitle'] !== 'string' ||
      typeof value['appliedAt'] !== 'string' ||
      !this.isApplicationStatus(value['status'])
    ) {
      return null;
    }
    return {
      id: value['_id'],
      jobId: value['jobId'],
      candidateName: value['candidateName'],
      candidateEmail: typeof value['candidateEmail'] === 'string' ? value['candidateEmail'] : '',
      jobTitle: value['jobTitle'],
      status: value['status'],
      appliedAt: value['appliedAt'],
      rating: this.readOptionalNumber(value['rating']),
      resumeUrl: typeof value['resumeUrl'] === 'string' ? value['resumeUrl'] : undefined
    };
  }

  private mapReference(row: unknown, labelKey: 'name'): RebuildRecruitmentReferenceOption | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const value = row as Record<string, unknown>;
    if (typeof value['_id'] !== 'string' || typeof value[labelKey] !== 'string') {
      return null;
    }
    return {
      id: value['_id'],
      label: value[labelKey]
    };
  }

  private isJobStatus(value: unknown): value is JobStatus {
    return value === 'draft' || value === 'open' || value === 'closed';
  }

  private isEmploymentType(value: unknown): value is EmploymentType {
    return (
      value === 'full_time' ||
      value === 'part_time' ||
      value === 'contract' ||
      value === 'intern' ||
      value === 'temporary'
    );
  }

  private isApplicationStatus(value: unknown): value is ApplicationStatus {
    return (
      value === 'new' ||
      value === 'screening' ||
      value === 'interview' ||
      value === 'offer' ||
      value === 'hired' ||
      value === 'rejected'
    );
  }

  private normalizeRole(role: unknown): AppRole {
    switch (role) {
      case 'super_admin':
      case 'admin':
      case 'hr_manager':
      case 'manager':
      case 'employee':
      case 'pending':
        return role;
      default:
        return 'pending';
    }
  }

  private normalizeOptionalText(value: string | undefined): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }

  private readOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    return undefined;
  }

  private toId<T extends TableNames>(table: T, id: string): Id<T> {
    void table;
    return id as Id<T>;
  }
}
