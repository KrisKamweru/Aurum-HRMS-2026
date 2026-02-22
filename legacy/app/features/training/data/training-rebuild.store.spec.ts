import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TrainingRebuildDataService } from './training-rebuild.data.service';
import { TrainingRebuildStore } from './training-rebuild.store';

describe('TrainingRebuildStore', () => {
  let store: TrainingRebuildStore;
  let dataService: {
    getViewerContext: ReturnType<typeof vi.fn>;
    listCourses: ReturnType<typeof vi.fn>;
    getCourse: ReturnType<typeof vi.fn>;
    createCourse: ReturnType<typeof vi.fn>;
    updateCourse: ReturnType<typeof vi.fn>;
    getMyEnrollments: ReturnType<typeof vi.fn>;
    enrollInCourse: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      getViewerContext: vi.fn(async () => ({ role: 'hr_manager', employeeId: 'emp-1' })),
      listCourses: vi.fn(async () => [
        {
          id: 'course-1',
          title: 'Leadership Essentials',
          description: 'Details',
          instructor: 'A. Trainer',
          startDate: '2026-03-01',
          endDate: '2026-03-02',
          type: 'workshop',
          status: 'upcoming',
          capacity: 30
        }
      ]),
      getCourse: vi.fn(async () => ({
        id: 'course-1',
        title: 'Leadership Essentials',
        description: 'Details',
        instructor: 'A. Trainer',
        startDate: '2026-03-01',
        endDate: '2026-03-02',
        type: 'workshop',
        status: 'upcoming',
        capacity: 30
      })),
      createCourse: vi.fn(async () => 'course-2'),
      updateCourse: vi.fn(async () => undefined),
      getMyEnrollments: vi.fn(async () => [
        {
          id: 'enr-1',
          courseId: 'course-1',
          courseTitle: 'Leadership Essentials',
          status: 'enrolled',
          progress: 10,
          enrollmentDate: '2026-02-21T00:00:00.000Z'
        }
      ]),
      enrollInCourse: vi.fn(async () => 'enr-2')
    };

    TestBed.configureTestingModule({
      providers: [{ provide: TrainingRebuildDataService, useValue: dataService }]
    });

    store = TestBed.inject(TrainingRebuildStore);
  });

  it('loads catalog and computes counters', async () => {
    await store.loadCatalog();

    expect(store.canManage()).toBe(true);
    expect(store.canEnroll()).toBe(true);
    expect(store.courses().length).toBe(1);
    expect(store.upcomingCourseCount()).toBe(1);
    expect(store.inProgressCourseCount()).toBe(0);
  });

  it('validates and creates courses', async () => {
    await store.loadCatalog();
    const invalid = await store.createCourse({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      type: 'workshop',
      status: 'upcoming'
    });
    const valid = await store.createCourse({
      title: 'People Management',
      description: 'Manager workshop',
      instructor: 'Lead Coach',
      startDate: '2026-04-01',
      endDate: '2026-04-02',
      type: 'workshop',
      status: 'upcoming',
      capacity: 25
    });

    expect(invalid).toBeNull();
    expect(valid).toBe('course-2');
    expect(dataService.createCourse).toHaveBeenCalledWith({
      title: 'People Management',
      description: 'Manager workshop',
      instructor: 'Lead Coach',
      startDate: '2026-04-01',
      endDate: '2026-04-02',
      type: 'workshop',
      status: 'upcoming',
      capacity: 25
    });
  });

  it('loads my-learning state and enrolls in a course', async () => {
    await store.loadMyLearning();
    const success = await store.enrollInCourse('course-1');

    expect(store.myLearning().length).toBe(1);
    expect(success).toBe(true);
    expect(dataService.enrollInCourse).toHaveBeenCalledWith('course-1');
  });

  it('updates existing courses', async () => {
    await store.loadCatalog();
    const success = await store.updateCourse({
      id: 'course-1',
      title: 'Leadership Essentials - Updated',
      description: 'Updated',
      instructor: 'A. Trainer',
      startDate: '2026-03-01',
      endDate: '2026-03-03',
      type: 'workshop',
      status: 'in_progress',
      capacity: 35
    });

    expect(success).toBe(true);
    expect(dataService.updateCourse).toHaveBeenCalledWith({
      id: 'course-1',
      title: 'Leadership Essentials - Updated',
      description: 'Updated',
      instructor: 'A. Trainer',
      startDate: '2026-03-01',
      endDate: '2026-03-03',
      type: 'workshop',
      status: 'in_progress',
      capacity: 35
    });
  });
});
