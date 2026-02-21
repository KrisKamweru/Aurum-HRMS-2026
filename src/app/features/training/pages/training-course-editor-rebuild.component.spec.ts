import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { vi } from 'vitest';
import { TrainingRebuildStore } from '../data/training-rebuild.store';
import { TrainingCourseEditorRebuildComponent } from './training-course-editor-rebuild.component';

describe('TrainingCourseEditorRebuildComponent', () => {
  let fixture: ComponentFixture<TrainingCourseEditorRebuildComponent>;
  let component: TrainingCourseEditorRebuildComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let storeMock: Pick<
    TrainingRebuildStore,
    | 'selectedCourse'
    | 'error'
    | 'catalogLoading'
    | 'detailLoading'
    | 'isSaving'
    | 'loadCatalog'
    | 'loadCourseDetail'
    | 'createCourse'
    | 'updateCourse'
  >;

  beforeEach(async () => {
    navigate = vi.fn(async () => true);

    storeMock = {
      selectedCourse: signal(null).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      catalogLoading: signal(false).asReadonly(),
      detailLoading: signal(false).asReadonly(),
      isSaving: signal(false).asReadonly(),
      loadCatalog: vi.fn(async () => {}),
      loadCourseDetail: vi.fn(async () => {}),
      createCourse: vi.fn(async () => 'course-2'),
      updateCourse: vi.fn(async () => true)
    };

    await TestBed.configureTestingModule({
      imports: [TrainingCourseEditorRebuildComponent],
      providers: [
        { provide: TrainingRebuildStore, useValue: storeMock },
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

    fixture = TestBed.createComponent(TrainingCourseEditorRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads catalog references on init', () => {
    expect(storeMock.loadCatalog).toHaveBeenCalledTimes(1);
  });

  it('creates a new course from form payload', async () => {
    await component.save({
      title: 'People Management',
      description: 'Details',
      instructor: 'Coach',
      startDate: '2026-04-01',
      endDate: '2026-04-02',
      type: 'workshop',
      status: 'upcoming',
      capacity: 20
    });

    expect(storeMock.createCourse).toHaveBeenCalledWith({
      title: 'People Management',
      description: 'Details',
      instructor: 'Coach',
      startDate: '2026-04-01',
      endDate: '2026-04-02',
      type: 'workshop',
      status: 'upcoming',
      capacity: 20
    });
    expect(navigate).toHaveBeenCalledWith(['/training/catalog']);
  });

  it('updates an existing course while editing', async () => {
    component.courseId.set('course-1');

    await component.save({
      title: 'People Management',
      description: 'Updated details',
      instructor: 'Coach',
      startDate: '2026-04-01',
      endDate: '2026-04-03',
      type: 'seminar',
      status: 'in_progress',
      capacity: '25'
    });

    expect(storeMock.updateCourse).toHaveBeenCalledWith({
      id: 'course-1',
      title: 'People Management',
      description: 'Updated details',
      instructor: 'Coach',
      startDate: '2026-04-01',
      endDate: '2026-04-03',
      type: 'seminar',
      status: 'in_progress',
      capacity: 25
    });
  });
});
