import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { RecruitmentRebuildStore } from '../data/recruitment-rebuild.store';
import { RecruitmentBoardRebuildComponent } from './recruitment-board-rebuild.component';

describe('RecruitmentBoardRebuildComponent', () => {
  let fixture: ComponentFixture<RecruitmentBoardRebuildComponent>;
  let component: RecruitmentBoardRebuildComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let storeMock: Pick<
    RecruitmentRebuildStore,
    'jobs' | 'applications' | 'boardLoading' | 'isSaving' | 'canManage' | 'error' | 'loadBoard' | 'updateApplicationStatus'
  >;

  beforeEach(async () => {
    navigate = vi.fn(async () => true);

    storeMock = {
      jobs: signal([{ id: 'job-1', title: 'Finance Analyst' }]).asReadonly(),
      applications: signal([
        {
          id: 'app-1',
          jobId: 'job-1',
          candidateName: 'Amina Said',
          candidateEmail: 'amina@aurum.test',
          jobTitle: 'Finance Analyst',
          status: 'new',
          appliedAt: '2026-02-21T00:00:00.000Z'
        }
      ]).asReadonly(),
      boardLoading: signal(false).asReadonly(),
      isSaving: signal(false).asReadonly(),
      canManage: computed(() => true),
      error: signal<string | null>(null).asReadonly(),
      loadBoard: vi.fn(async () => {}),
      updateApplicationStatus: vi.fn(async () => true)
    };

    await TestBed.configureTestingModule({
      imports: [RecruitmentBoardRebuildComponent],
      providers: [
        { provide: RecruitmentRebuildStore, useValue: storeMock },
        { provide: Router, useValue: { navigate } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecruitmentBoardRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads board state on init', () => {
    expect(storeMock.loadBoard).toHaveBeenCalledWith(undefined);
  });

  it('forwards application status updates', async () => {
    const event = { target: { value: 'interview' } } as unknown as Event;
    await component.updateStatus('app-1', event);
    expect(storeMock.updateApplicationStatus).toHaveBeenCalledWith('app-1', 'interview');
  });

  it('navigates back to job detail', () => {
    component.viewJob('job-1');
    expect(navigate).toHaveBeenCalledWith(['/recruitment/jobs', 'job-1']);
  });
});
