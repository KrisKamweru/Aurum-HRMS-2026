import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { vi } from 'vitest';
import { RecruitmentRebuildStore } from '../data/recruitment-rebuild.store';
import { RecruitmentJobDetailRebuildComponent } from './recruitment-job-detail-rebuild.component';

describe('RecruitmentJobDetailRebuildComponent', () => {
  let fixture: ComponentFixture<RecruitmentJobDetailRebuildComponent>;
  let component: RecruitmentJobDetailRebuildComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let storeMock: Pick<
    RecruitmentRebuildStore,
    'detailLoading' | 'isSaving' | 'error' | 'selectedJob' | 'canManage' | 'loadJobDetail' | 'submitApplication' | 'clearError'
  >;

  beforeEach(async () => {
    navigate = vi.fn(async () => true);

    storeMock = {
      detailLoading: signal(false).asReadonly(),
      isSaving: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      selectedJob: signal({
        id: 'job-1',
        title: 'Finance Analyst',
        description: 'Role details',
        employmentType: 'full_time',
        status: 'open',
        salaryRange: '',
        closingDate: '',
        createdAt: '2026-02-21T00:00:00.000Z'
      }).asReadonly(),
      canManage: computed(() => true),
      loadJobDetail: vi.fn(async () => {}),
      submitApplication: vi.fn(async () => true),
      clearError: vi.fn(() => {})
    };

    await TestBed.configureTestingModule({
      imports: [RecruitmentJobDetailRebuildComponent],
      providers: [
        { provide: RecruitmentRebuildStore, useValue: storeMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'job-1'
              }
            }
          }
        },
        { provide: Router, useValue: { navigate } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecruitmentJobDetailRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads selected job on init', () => {
    expect(storeMock.loadJobDetail).toHaveBeenCalledWith('job-1');
  });

  it('submits application payload and closes modal', async () => {
    component.openApplicationModal();
    expect(component.isApplicationModalOpen()).toBe(true);

    await component.submitApplication({
      firstName: 'Amina',
      lastName: 'Said',
      email: 'amina@aurum.test',
      notes: 'Strong background'
    });

    expect(storeMock.submitApplication).toHaveBeenCalledWith('job-1', {
      firstName: 'Amina',
      lastName: 'Said',
      email: 'amina@aurum.test',
      phone: '',
      notes: 'Strong background'
    });
    expect(component.isApplicationModalOpen()).toBe(false);
  });
});
