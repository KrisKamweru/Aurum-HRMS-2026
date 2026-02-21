import { AppRole } from '../../../core/auth/auth.types';

export type JobStatus = 'draft' | 'open' | 'closed';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern' | 'temporary';
export type ApplicationStatus = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface RebuildRecruitmentViewerContext {
  role: AppRole;
  employeeId?: string;
}

export interface RebuildRecruitmentJob {
  id: string;
  title: string;
  description: string;
  departmentId?: string;
  departmentName?: string;
  locationId?: string;
  locationName?: string;
  employmentType: EmploymentType;
  salaryRange: string;
  closingDate: string;
  status: JobStatus;
  createdAt: string;
}

export interface RebuildRecruitmentApplication {
  id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  status: ApplicationStatus;
  appliedAt: string;
  rating?: number;
  resumeUrl?: string;
}

export interface RebuildRecruitmentReferenceOption {
  id: string;
  label: string;
}

export interface CreateJobInput {
  title: string;
  description: string;
  departmentId?: string;
  locationId?: string;
  employmentType: EmploymentType;
  salaryRange?: string;
  closingDate?: string;
  status: JobStatus;
}

export interface UpdateJobInput extends CreateJobInput {
  id: string;
}

export interface SubmitApplicationInput {
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
}
