import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { TrainingRebuildStore } from '../data/training-rebuild.store';
import { TrainingCatalogRebuildComponent } from './training-catalog-rebuild.component';

describe('TrainingCatalogRebuildComponent', () => {
  let fixture: ComponentFixture<TrainingCatalogRebuildComponent>;
  let component: TrainingCatalogRebuildComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let storeMock: Pick<
    TrainingRebuildStore,
    | 'courses'
    | 'catalogLoading'
    | 'isSaving'
    | 'error'
    | 'canManage'
    | 'canEnroll'
    | 'upcomingCourseCount'
    | 'inProgressCourseCount'
    | 'completedCourseCount'
    | 'loadCatalog'
    | 'enrollInCourse'
  >;

  beforeEach(async () => {
    navigate = vi.fn(async () => true);

    storeMock = {
      courses: signal([
        {
          id: 'course-1',
          title: 'Leadership Essentials',
          description: 'Details',
          instructor: 'A. Trainer',
          startDate: '2026-03-01',
          endDate: '2026-03-02',
          type: 'workshop',
          status: 'upcoming',
          capacity: 20
        }
      ]).asReadonly(),
      catalogLoading: signal(false).asReadonly(),
      isSaving: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      canManage: computed(() => true),
      canEnroll: computed(() => true),
      upcomingCourseCount: computed(() => 1),
      inProgressCourseCount: computed(() => 0),
      completedCourseCount: computed(() => 0),
      loadCatalog: vi.fn(async () => {}),
      enrollInCourse: vi.fn(async () => true)
    };

    await TestBed.configureTestingModule({
      imports: [TrainingCatalogRebuildComponent],
      providers: [
        { provide: TrainingRebuildStore, useValue: storeMock },
        { provide: Router, useValue: { navigate } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingCatalogRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads catalog state on init', () => {
    expect(storeMock.loadCatalog).toHaveBeenCalledTimes(1);
  });

  it('navigates to create/edit/my-learning routes', () => {
    component.openCreateCourse();
    component.editCourse('course-1');
    component.openMyLearning();

    expect(navigate).toHaveBeenCalledWith(['/training/courses/new']);
    expect(navigate).toHaveBeenCalledWith(['/training/courses', 'course-1', 'edit']);
    expect(navigate).toHaveBeenCalledWith(['/training/my-learning']);
  });

  it('enrolls and redirects to my-learning', async () => {
    await component.enroll('course-1');

    expect(storeMock.enrollInCourse).toHaveBeenCalledWith('course-1');
    expect(navigate).toHaveBeenCalledWith(['/training/my-learning']);
  });
});
