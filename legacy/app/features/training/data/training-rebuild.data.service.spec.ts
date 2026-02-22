import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { api } from '../../../../../convex/_generated/api';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { TrainingRebuildDataService } from './training-rebuild.data.service';

describe('TrainingRebuildDataService', () => {
  let service: TrainingRebuildDataService;
  let query: ReturnType<typeof vi.fn>;
  let mutation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn(async () => null);
    mutation = vi.fn(async () => null);

    TestBed.configureTestingModule({
      providers: [
        TrainingRebuildDataService,
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

    service = TestBed.inject(TrainingRebuildDataService);
  });

  it('maps viewer context, course list, and enrollment list', async () => {
    query.mockResolvedValueOnce({ role: 'employee', employeeId: 'emp-1' });
    query.mockResolvedValueOnce([
      {
        _id: 'course-1',
        title: 'Leadership Essentials',
        description: 'Leadership fundamentals',
        instructor: 'A. Trainer',
        startDate: '2026-03-01',
        endDate: '2026-03-02',
        type: 'workshop',
        status: 'upcoming',
        capacity: 30
      }
    ]);
    query.mockResolvedValueOnce([
      {
        _id: 'enr-1',
        courseId: 'course-1',
        courseTitle: 'Leadership Essentials',
        courseStartDate: '2026-03-01',
        courseEndDate: '2026-03-02',
        courseStatus: 'upcoming',
        status: 'enrolled',
        progress: 25,
        enrollmentDate: '2026-02-21T00:00:00.000Z'
      }
    ]);

    const viewer = await service.getViewerContext();
    const courses = await service.listCourses();
    const enrollments = await service.getMyEnrollments();

    expect(viewer.role).toBe('employee');
    expect(viewer.employeeId).toBe('emp-1');
    expect(courses[0]?.title).toBe('Leadership Essentials');
    expect(courses[0]?.type).toBe('workshop');
    expect(enrollments[0]?.status).toBe('enrolled');
    expect(enrollments[0]?.progress).toBe(25);
  });

  it('submits create/update/enroll mutations with expected payloads', async () => {
    query.mockResolvedValueOnce({
      _id: 'course-2',
      title: 'Advanced Excel',
      description: 'Spreadsheet mastery',
      instructor: 'C. Analyst',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      type: 'online',
      status: 'in_progress'
    });
    mutation.mockResolvedValueOnce('course-3');
    mutation.mockResolvedValueOnce(undefined);
    mutation.mockResolvedValueOnce('enr-2');

    const course = await service.getCourse('course-2');
    const createId = await service.createCourse({
      title: 'Performance Coaching',
      description: 'Coaching track',
      instructor: '  ',
      startDate: '2026-05-01',
      endDate: '2026-05-03',
      type: 'seminar',
      status: 'upcoming',
      capacity: 15
    });
    await service.updateCourse({
      id: 'course-3',
      title: 'Performance Coaching - Level 2',
      description: 'Updated details',
      instructor: 'Lead Coach',
      startDate: '2026-05-02',
      endDate: '2026-05-04',
      type: 'seminar',
      status: 'in_progress',
      capacity: 20
    });
    const enrollmentId = await service.enrollInCourse('course-3');

    expect(course?.id).toBe('course-2');
    expect(createId).toBe('course-3');
    expect(enrollmentId).toBe('enr-2');
    expect(mutation).toHaveBeenNthCalledWith(1, api.training.createCourse, {
      title: 'Performance Coaching',
      description: 'Coaching track',
      instructor: undefined,
      startDate: '2026-05-01',
      endDate: '2026-05-03',
      type: 'seminar',
      status: 'upcoming',
      capacity: 15
    });
    expect(mutation).toHaveBeenNthCalledWith(3, api.training.enrollEmployee, {
      courseId: 'course-3'
    });
  });
});
