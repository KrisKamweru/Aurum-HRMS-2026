import { Injectable, inject } from '@angular/core';
import { api } from '../../../../../convex/_generated/api';
import { Id, TableNames } from '../../../../../convex/_generated/dataModel';
import { AppRole } from '../../../core/auth/auth.types';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import {
  CreateCourseInput,
  RebuildTrainingCourse,
  RebuildTrainingEnrollment,
  RebuildTrainingViewerContext,
  TrainingCourseStatus,
  TrainingCourseType,
  TrainingEnrollmentStatus,
  UpdateCourseInput
} from './training-rebuild.models';

@Injectable({ providedIn: 'root' })
export class TrainingRebuildDataService {
  private readonly convexClient = inject(ConvexClientService);
  private readonly convex = this.convexClient.getHttpClient();

  async getViewerContext(): Promise<RebuildTrainingViewerContext> {
    const viewer = await this.convex.query(api.users.viewer, {});
    if (!viewer || typeof viewer !== 'object') {
      return { role: 'pending' };
    }
    const record = viewer as Record<string, unknown>;
    return {
      role: this.normalizeRole(record['role']),
      employeeId: typeof record['employeeId'] === 'string' ? record['employeeId'] : undefined
    };
  }

  async listCourses(status?: TrainingCourseStatus): Promise<RebuildTrainingCourse[]> {
    const rows = await this.convex.query(api.training.listCourses, { status });
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapCourse(row))
      .filter((row): row is RebuildTrainingCourse => row !== null);
  }

  async getCourse(id: string): Promise<RebuildTrainingCourse | null> {
    const row = await this.convex.query(api.training.getCourse, { id: this.toId('training_courses', id) });
    return this.mapCourse(row);
  }

  async createCourse(input: CreateCourseInput): Promise<string> {
    const id = await this.convex.mutation(api.training.createCourse, {
      title: input.title,
      description: input.description,
      instructor: this.normalizeOptionalText(input.instructor),
      startDate: input.startDate,
      endDate: input.endDate,
      type: input.type,
      status: input.status,
      capacity: input.capacity
    });
    return typeof id === 'string' ? id : '';
  }

  async updateCourse(input: UpdateCourseInput): Promise<void> {
    await this.convex.mutation(api.training.updateCourse, {
      id: this.toId('training_courses', input.id),
      updates: {
        title: input.title,
        description: input.description,
        instructor: this.normalizeOptionalText(input.instructor),
        startDate: input.startDate,
        endDate: input.endDate,
        type: input.type,
        status: input.status,
        capacity: input.capacity
      }
    });
  }

  async getMyEnrollments(): Promise<RebuildTrainingEnrollment[]> {
    const rows = await this.convex.query(api.training.getMyEnrollments, {});
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapEnrollment(row))
      .filter((row): row is RebuildTrainingEnrollment => row !== null);
  }

  async enrollInCourse(courseId: string): Promise<string> {
    const id = await this.convex.mutation(api.training.enrollEmployee, {
      courseId: this.toId('training_courses', courseId)
    });
    return typeof id === 'string' ? id : '';
  }

  private mapCourse(row: unknown): RebuildTrainingCourse | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['title'] !== 'string' ||
      typeof value['description'] !== 'string' ||
      typeof value['startDate'] !== 'string' ||
      typeof value['endDate'] !== 'string' ||
      !this.isCourseType(value['type']) ||
      !this.isCourseStatus(value['status'])
    ) {
      return null;
    }

    return {
      id: value['_id'],
      title: value['title'],
      description: value['description'],
      instructor: typeof value['instructor'] === 'string' ? value['instructor'] : '',
      startDate: value['startDate'],
      endDate: value['endDate'],
      type: value['type'],
      status: value['status'],
      capacity: this.readOptionalNumber(value['capacity'])
    };
  }

  private mapEnrollment(row: unknown): RebuildTrainingEnrollment | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['courseId'] !== 'string' ||
      typeof value['courseTitle'] !== 'string' ||
      !this.isEnrollmentStatus(value['status']) ||
      typeof value['enrollmentDate'] !== 'string'
    ) {
      return null;
    }

    return {
      id: value['_id'],
      courseId: value['courseId'],
      courseTitle: value['courseTitle'],
      courseStartDate: typeof value['courseStartDate'] === 'string' ? value['courseStartDate'] : undefined,
      courseEndDate: typeof value['courseEndDate'] === 'string' ? value['courseEndDate'] : undefined,
      courseStatus: this.isCourseStatus(value['courseStatus']) ? value['courseStatus'] : undefined,
      status: value['status'],
      progress: this.readNumber(value['progress']),
      enrollmentDate: value['enrollmentDate'],
      completionDate: typeof value['completionDate'] === 'string' ? value['completionDate'] : undefined
    };
  }

  private normalizeRole(role: unknown): AppRole {
    switch (role) {
      case 'super_admin':
      case 'admin':
      case 'hr_manager':
      case 'manager':
      case 'employee':
      case 'pending':
        return role;
      default:
        return 'pending';
    }
  }

  private isCourseStatus(value: unknown): value is TrainingCourseStatus {
    return value === 'upcoming' || value === 'in_progress' || value === 'completed' || value === 'cancelled';
  }

  private isCourseType(value: unknown): value is TrainingCourseType {
    return value === 'workshop' || value === 'seminar' || value === 'online' || value === 'other';
  }

  private isEnrollmentStatus(value: unknown): value is TrainingEnrollmentStatus {
    return value === 'enrolled' || value === 'completed' || value === 'dropped' || value === 'failed';
  }

  private normalizeOptionalText(value: string | undefined): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }

  private readNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private readOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    return undefined;
  }

  private toId<T extends TableNames>(table: T, id: string): Id<T> {
    void table;
    return id as Id<T>;
  }
}
