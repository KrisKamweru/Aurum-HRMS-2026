import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { RecruitmentRebuildStore } from '../data/recruitment-rebuild.store';
import { RecruitmentJobsRebuildComponent } from './recruitment-jobs-rebuild.component';

describe('RecruitmentJobsRebuildComponent', () => {
  let fixture: ComponentFixture<RecruitmentJobsRebuildComponent>;
  let component: RecruitmentJobsRebuildComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let storeMock: Pick<
    RecruitmentRebuildStore,
    'jobs' | 'listLoading' | 'error' | 'canManage' | 'openJobCount' | 'closedJobCount' | 'loadJobsView'
  >;

  beforeEach(async () => {
    navigate = vi.fn(async () => true);

    storeMock = {
      jobs: signal([
        {
          id: 'job-1',
          title: 'Finance Analyst',
          description: 'Details',
          employmentType: 'full_time',
          status: 'open'
        }
      ]).asReadonly(),
      listLoading: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      canManage: computed(() => true),
      openJobCount: computed(() => 1),
      closedJobCount: computed(() => 0),
      loadJobsView: vi.fn(async () => {})
    };

    await TestBed.configureTestingModule({
      imports: [RecruitmentJobsRebuildComponent],
      providers: [
        { provide: RecruitmentRebuildStore, useValue: storeMock },
        { provide: Router, useValue: { navigate } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecruitmentJobsRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads job listings on init', () => {
    expect(storeMock.loadJobsView).toHaveBeenCalledTimes(1);
  });

  it('navigates to job detail/editor/board routes', () => {
    component.openDetail('job-1');
    component.editJob('job-1');
    component.openBoard();

    expect(navigate).toHaveBeenCalledWith(['/recruitment/jobs', 'job-1']);
    expect(navigate).toHaveBeenCalledWith(['/recruitment/jobs', 'job-1', 'edit']);
    expect(navigate).toHaveBeenCalledWith(['/recruitment/board']);
  });
});
