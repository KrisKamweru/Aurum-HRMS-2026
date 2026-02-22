import { Injectable, computed, inject, signal } from '@angular/core';
import {
  CreateCourseInput,
  RebuildTrainingCourse,
  RebuildTrainingEnrollment,
  RebuildTrainingViewerContext,
  TrainingCourseStatus,
  TrainingCourseType,
  UpdateCourseInput
} from './training-rebuild.models';
import { TrainingRebuildDataService } from './training-rebuild.data.service';

interface CourseDraft {
  title: string;
  description: string;
  instructor?: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  capacity?: number;
}

@Injectable({ providedIn: 'root' })
export class TrainingRebuildStore {
  private readonly data = inject(TrainingRebuildDataService);

  private readonly viewerState = signal<RebuildTrainingViewerContext>({ role: 'pending' });
  private readonly courseState = signal<RebuildTrainingCourse[]>([]);
  private readonly enrollmentState = signal<RebuildTrainingEnrollment[]>([]);
  private readonly selectedCourseState = signal<RebuildTrainingCourse | null>(null);

  private readonly catalogLoadingState = signal(false);
  private readonly myLearningLoadingState = signal(false);
  private readonly detailLoadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly viewerLoadedState = signal(false);

  readonly viewer = this.viewerState.asReadonly();
  readonly courses = this.courseState.asReadonly();
  readonly myLearning = this.enrollmentState.asReadonly();
  readonly selectedCourse = this.selectedCourseState.asReadonly();

  readonly catalogLoading = this.catalogLoadingState.asReadonly();
  readonly myLearningLoading = this.myLearningLoadingState.asReadonly();
  readonly detailLoading = this.detailLoadingState.asReadonly();
  readonly isSaving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly canManage = computed(() => {
    const role = this.viewer().role;
    return role === 'super_admin' || role === 'admin' || role === 'hr_manager' || role === 'manager';
  });

  readonly canEnroll = computed(() => !!this.viewer().employeeId);
  readonly upcomingCourseCount = computed(() => this.courses().filter((course) => course.status === 'upcoming').length);
  readonly inProgressCourseCount = computed(
    () => this.courses().filter((course) => course.status === 'in_progress').length
  );
  readonly completedCourseCount = computed(() => this.courses().filter((course) => course.status === 'completed').length);

  async loadCatalog(status?: TrainingCourseStatus): Promise<void> {
    this.catalogLoadingState.set(true);
    this.clearError();
    try {
      await this.ensureViewer();
      this.courseState.set(await this.data.listCourses(status));
    } catch (error: unknown) {
      this.setError(error, 'Unable to load training catalog.');
    } finally {
      this.catalogLoadingState.set(false);
    }
  }

  async loadMyLearning(): Promise<void> {
    this.myLearningLoadingState.set(true);
    this.clearError();
    try {
      await this.ensureViewer();
      this.enrollmentState.set(await this.data.getMyEnrollments());
    } catch (error: unknown) {
      this.setError(error, 'Unable to load learning enrollments.');
    } finally {
      this.myLearningLoadingState.set(false);
    }
  }

  async loadCourseDetail(id: string): Promise<void> {
    const courseId = id.trim();
    if (!courseId) {
      this.errorState.set('Course id is required.');
      return;
    }

    this.detailLoadingState.set(true);
    this.clearError();
    try {
      await this.ensureViewer();
      const course = await this.data.getCourse(courseId);
      this.selectedCourseState.set(course);
      if (!course) {
        this.errorState.set('Course not found.');
      }
    } catch (error: unknown) {
      this.selectedCourseState.set(null);
      this.setError(error, 'Unable to load course detail.');
    } finally {
      this.detailLoadingState.set(false);
    }
  }

  async createCourse(payload: CourseDraft): Promise<string | null> {
    const input = this.normalizeCourseDraft(payload);
    if (!input) {
      return null;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      const id = await this.data.createCourse(input);
      await this.loadCatalog();
      return id || null;
    } catch (error: unknown) {
      this.setError(error, 'Unable to create training course.');
      return null;
    } finally {
      this.savingState.set(false);
    }
  }

  async updateCourse(payload: CourseDraft & { id: string }): Promise<boolean> {
    const id = payload.id.trim();
    if (!id) {
      this.errorState.set('Course id is required.');
      return false;
    }

    const normalized = this.normalizeCourseDraft(payload);
    if (!normalized) {
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      const input: UpdateCourseInput = {
        id,
        ...normalized
      };
      await this.data.updateCourse(input);
      await this.loadCatalog();
      if (this.selectedCourse()?.id === id) {
        await this.loadCourseDetail(id);
      }
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to update training course.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async enrollInCourse(courseId: string): Promise<boolean> {
    const id = courseId.trim();
    if (!id) {
      this.errorState.set('Course id is required.');
      return false;
    }

    await this.ensureViewer();
    if (!this.canEnroll()) {
      this.errorState.set('Only linked employees can enroll in training.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.enrollInCourse(id);
      await Promise.all([this.loadCatalog(), this.loadMyLearning()]);
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to enroll in course.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private async ensureViewer(): Promise<void> {
    if (this.viewerLoadedState()) {
      return;
    }
    this.viewerState.set(await this.data.getViewerContext());
    this.viewerLoadedState.set(true);
  }

  private normalizeCourseDraft(payload: CourseDraft): CreateCourseInput | null {
    if (!this.canManage()) {
      this.errorState.set('You do not have permission to manage training courses.');
      return null;
    }

    const title = payload.title.trim();
    const description = payload.description.trim();
    const startDate = payload.startDate.trim();
    const endDate = payload.endDate.trim();
    const type = this.normalizeCourseType(payload.type);
    const status = this.normalizeCourseStatus(payload.status);

    if (!title || !description || !startDate || !endDate) {
      this.errorState.set('Title, description, start date, and end date are required.');
      return null;
    }
    if (!type || !status) {
      this.errorState.set('Select a valid course type and status.');
      return null;
    }
    if (Number.isNaN(Date.parse(startDate)) || Number.isNaN(Date.parse(endDate))) {
      this.errorState.set('Start and end dates must be valid.');
      return null;
    }
    if (Date.parse(endDate) < Date.parse(startDate)) {
      this.errorState.set('End date must be on or after start date.');
      return null;
    }
    if (payload.capacity !== undefined && (!Number.isFinite(payload.capacity) || payload.capacity <= 0)) {
      this.errorState.set('Capacity must be greater than zero when provided.');
      return null;
    }

    const instructor = payload.instructor?.trim();
    return {
      title,
      description,
      instructor: instructor && instructor.length > 0 ? instructor : undefined,
      startDate,
      endDate,
      type,
      status,
      capacity: payload.capacity
    };
  }

  private normalizeCourseType(value: string): TrainingCourseType | null {
    if (value === 'workshop' || value === 'seminar' || value === 'online' || value === 'other') {
      return value;
    }
    return null;
  }

  private normalizeCourseStatus(value: string): TrainingCourseStatus | null {
    if (value === 'upcoming' || value === 'in_progress' || value === 'completed' || value === 'cancelled') {
      return value;
    }
    return null;
  }

  private setError(error: unknown, fallback: string): void {
    if (error instanceof Error && error.message.trim().length > 0) {
      this.errorState.set(error.message);
      return;
    }
    this.errorState.set(fallback);
  }
}
