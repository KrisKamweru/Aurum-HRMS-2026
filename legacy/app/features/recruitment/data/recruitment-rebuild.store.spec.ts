import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RecruitmentRebuildDataService } from './recruitment-rebuild.data.service';
import { RecruitmentRebuildStore } from './recruitment-rebuild.store';

describe('RecruitmentRebuildStore', () => {
  let store: RecruitmentRebuildStore;
  let dataService: {
    getViewerContext: ReturnType<typeof vi.fn>;
    listDepartments: ReturnType<typeof vi.fn>;
    listLocations: ReturnType<typeof vi.fn>;
    listJobs: ReturnType<typeof vi.fn>;
    getJob: ReturnType<typeof vi.fn>;
    listApplications: ReturnType<typeof vi.fn>;
    createJob: ReturnType<typeof vi.fn>;
    updateJob: ReturnType<typeof vi.fn>;
    submitApplication: ReturnType<typeof vi.fn>;
    updateApplicationStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      getViewerContext: vi.fn(async () => ({ role: 'hr_manager', employeeId: 'emp-1' })),
      listDepartments: vi.fn(async () => [{ id: 'dept-1', label: 'Finance' }]),
      listLocations: vi.fn(async () => [{ id: 'loc-1', label: 'Nairobi HQ' }]),
      listJobs: vi.fn(async () => [
        {
          id: 'job-1',
          title: 'Finance Analyst',
          description: 'Details',
          departmentId: 'dept-1',
          departmentName: 'Finance',
          locationId: 'loc-1',
          locationName: 'Nairobi HQ',
          employmentType: 'full_time',
          salaryRange: 'KES 100,000',
          closingDate: '2026-03-01',
          status: 'open',
          createdAt: '2026-02-21T00:00:00.000Z'
        }
      ]),
      getJob: vi.fn(async () => ({
        id: 'job-1',
        title: 'Finance Analyst',
        description: 'Details',
        departmentId: 'dept-1',
        employmentType: 'full_time',
        status: 'open',
        salaryRange: '',
        closingDate: '',
        createdAt: '2026-02-21T00:00:00.000Z'
      })),
      listApplications: vi.fn(async () => [
        {
          id: 'app-1',
          jobId: 'job-1',
          candidateName: 'Amina Said',
          candidateEmail: 'amina@aurum.test',
          jobTitle: 'Finance Analyst',
          status: 'new',
          appliedAt: '2026-02-21T00:00:00.000Z'
        }
      ]),
      createJob: vi.fn(async () => 'job-2'),
      updateJob: vi.fn(async () => undefined),
      submitApplication: vi.fn(async () => undefined),
      updateApplicationStatus: vi.fn(async () => undefined)
    };

    TestBed.configureTestingModule({
      providers: [{ provide: RecruitmentRebuildDataService, useValue: dataService }]
    });

    store = TestBed.inject(RecruitmentRebuildStore);
  });

  it('loads jobs and computes aggregate counters', async () => {
    await store.loadJobsView();

    expect(store.canManage()).toBe(true);
    expect(store.jobs().length).toBe(1);
    expect(store.openJobCount()).toBe(1);
    expect(store.closedJobCount()).toBe(0);
  });

  it('validates and creates job postings', async () => {
    await store.loadJobsView();
    const invalid = await store.createJob({
      title: '',
      description: '',
      departmentId: '',
      employmentType: 'full_time',
      status: 'draft'
    });
    const valid = await store.createJob({
      title: 'HR Lead',
      description: 'Role details',
      departmentId: 'dept-1',
      locationId: 'loc-1',
      employmentType: 'full_time',
      salaryRange: 'KES 120,000',
      closingDate: '2026-03-01',
      status: 'draft'
    });

    expect(invalid).toBeNull();
    expect(valid).toBe('job-2');
    expect(dataService.createJob).toHaveBeenCalledWith({
      title: 'HR Lead',
      description: 'Role details',
      departmentId: 'dept-1',
      locationId: 'loc-1',
      employmentType: 'full_time',
      salaryRange: 'KES 120,000',
      closingDate: '2026-03-01',
      status: 'draft'
    });
  });

  it('loads board state and updates candidate status', async () => {
    await store.loadBoard();
    const success = await store.updateApplicationStatus('app-1', 'interview');

    expect(success).toBe(true);
    expect(store.applications()[0]?.status).toBe('interview');
    expect(dataService.updateApplicationStatus).toHaveBeenCalledWith('app-1', 'interview');
  });

  it('validates application email before submit', async () => {
    const invalid = await store.submitApplication('job-1', {
      firstName: 'Amina',
      lastName: 'Said',
      email: 'invalid-email'
    });
    const valid = await store.submitApplication('job-1', {
      firstName: 'Amina',
      lastName: 'Said',
      email: 'amina@aurum.test'
    });

    expect(invalid).toBe(false);
    expect(valid).toBe(true);
    expect(dataService.submitApplication).toHaveBeenCalledWith({
      jobId: 'job-1',
      firstName: 'Amina',
      lastName: 'Said',
      email: 'amina@aurum.test',
      phone: undefined,
      notes: undefined
    });
  });
});
