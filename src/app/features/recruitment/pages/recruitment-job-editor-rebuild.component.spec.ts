import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { vi } from 'vitest';
import { RecruitmentRebuildStore } from '../data/recruitment-rebuild.store';
import { RecruitmentJobEditorRebuildComponent } from './recruitment-job-editor-rebuild.component';

describe('RecruitmentJobEditorRebuildComponent', () => {
  let fixture: ComponentFixture<RecruitmentJobEditorRebuildComponent>;
  let component: RecruitmentJobEditorRebuildComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let storeMock: Pick<
    RecruitmentRebuildStore,
    | 'departments'
    | 'locations'
    | 'selectedJob'
    | 'error'
    | 'listLoading'
    | 'detailLoading'
    | 'isSaving'
    | 'loadJobsView'
    | 'loadJobDetail'
    | 'updateJob'
    | 'createJob'
  >;

  beforeEach(async () => {
    navigate = vi.fn(async () => true);

    storeMock = {
      departments: signal([{ id: 'dept-1', label: 'Finance' }]).asReadonly(),
      locations: signal([{ id: 'loc-1', label: 'Nairobi HQ' }]).asReadonly(),
      selectedJob: signal(null).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      listLoading: signal(false).asReadonly(),
      detailLoading: signal(false).asReadonly(),
      isSaving: signal(false).asReadonly(),
      loadJobsView: vi.fn(async () => {}),
      loadJobDetail: vi.fn(async () => {}),
      updateJob: vi.fn(async () => true),
      createJob: vi.fn(async () => 'job-2')
    };

    await TestBed.configureTestingModule({
      imports: [RecruitmentJobEditorRebuildComponent],
      providers: [
        { provide: RecruitmentRebuildStore, useValue: storeMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => null
              }
            }
          }
        },
        { provide: Router, useValue: { navigate } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecruitmentJobEditorRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads references on init', () => {
    expect(storeMock.loadJobsView).toHaveBeenCalledTimes(1);
  });

  it('creates new jobs from form payload', async () => {
    await component.save({
      title: 'HR Lead',
      description: 'Role details',
      departmentId: 'dept-1',
      locationId: 'loc-1',
      employmentType: 'full_time',
      status: 'draft'
    });

    expect(storeMock.createJob).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/recruitment/jobs', 'job-2']);
  });

  it('updates existing jobs when editing', async () => {
    component.jobId.set('job-1');

    await component.save({
      title: 'HR Lead',
      description: 'Role details',
      departmentId: 'dept-1',
      locationId: 'loc-1',
      employmentType: 'full_time',
      status: 'open'
    });

    expect(storeMock.updateJob).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'job-1',
        title: 'HR Lead'
      })
    );
  });
});
