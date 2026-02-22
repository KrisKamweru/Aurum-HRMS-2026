import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { api } from '../../../../../convex/_generated/api';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { RecruitmentRebuildDataService } from './recruitment-rebuild.data.service';

describe('RecruitmentRebuildDataService', () => {
  let service: RecruitmentRebuildDataService;
  let query: ReturnType<typeof vi.fn>;
  let mutation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn(async () => null);
    mutation = vi.fn(async () => null);

    TestBed.configureTestingModule({
      providers: [
        RecruitmentRebuildDataService,
        {
          provide: ConvexClientService,
          useValue: {
            getHttpClient: () => ({
              query,
              mutation
            })
          }
        }
      ]
    });

    service = TestBed.inject(RecruitmentRebuildDataService);
  });

  it('maps viewer, job list, and application list', async () => {
    query.mockResolvedValueOnce({ role: 'manager', employeeId: 'emp-1' });
    query.mockResolvedValueOnce([
      {
        _id: 'job-1',
        title: 'Finance Analyst',
        description: 'Role details',
        departmentId: 'dept-1',
        departmentName: 'Finance',
        locationId: 'loc-1',
        locationName: 'Nairobi',
        employmentType: 'full_time',
        salaryRange: 'KES 100,000',
        status: 'open',
        createdAt: '2026-02-21T00:00:00.000Z'
      }
    ]);
    query.mockResolvedValueOnce([
      {
        _id: 'app-1',
        jobId: 'job-1',
        candidateName: 'Jane Doe',
        candidateEmail: 'jane@aurum.test',
        jobTitle: 'Finance Analyst',
        status: 'screening',
        appliedAt: '2026-02-21T00:00:00.000Z'
      }
    ]);

    const viewer = await service.getViewerContext();
    const jobs = await service.listJobs();
    const applications = await service.listApplications();

    expect(viewer.role).toBe('manager');
    expect(jobs[0]?.title).toBe('Finance Analyst');
    expect(jobs[0]?.status).toBe('open');
    expect(applications[0]?.candidateName).toBe('Jane Doe');
    expect(applications[0]?.status).toBe('screening');
  });

  it('submits job and application mutations with typed payloads', async () => {
    mutation.mockResolvedValueOnce('job-2');
    mutation.mockResolvedValueOnce(undefined);
    mutation.mockResolvedValueOnce(undefined);
    mutation.mockResolvedValueOnce(undefined);

    const id = await service.createJob({
      title: 'HR Generalist',
      description: 'Details',
      departmentId: 'dept-1',
      locationId: 'loc-1',
      employmentType: 'full_time',
      salaryRange: 'KES 120,000',
      closingDate: '2026-03-01',
      status: 'draft'
    });
    await service.updateJob({
      id: 'job-2',
      title: 'HR Lead',
      description: 'Updated details',
      departmentId: 'dept-1',
      employmentType: 'full_time',
      status: 'open'
    });
    await service.submitApplication({
      jobId: 'job-2',
      firstName: 'Amina',
      lastName: 'Said',
      email: 'amina@aurum.test',
      notes: 'Strong profile'
    });
    await service.updateApplicationStatus('app-1', 'interview');

    expect(id).toBe('job-2');
    expect(mutation).toHaveBeenNthCalledWith(1, api.recruitment.createJob, {
      title: 'HR Generalist',
      description: 'Details',
      departmentId: 'dept-1',
      locationId: 'loc-1',
      employmentType: 'full_time',
      salaryRange: 'KES 120,000',
      closingDate: '2026-03-01',
      status: 'draft'
    });
    expect(mutation).toHaveBeenNthCalledWith(4, api.recruitment.updateApplicationStatus, {
      id: 'app-1',
      status: 'interview',
      rating: undefined
    });
  });
});
