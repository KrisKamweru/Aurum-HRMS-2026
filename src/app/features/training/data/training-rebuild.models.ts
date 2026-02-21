import { AppRole } from '../../../core/auth/auth.types';

export type TrainingCourseStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
export type TrainingCourseType = 'workshop' | 'seminar' | 'online' | 'other';
export type TrainingEnrollmentStatus = 'enrolled' | 'completed' | 'dropped' | 'failed';

export interface RebuildTrainingViewerContext {
  role: AppRole;
  employeeId?: string;
}

export interface RebuildTrainingCourse {
  id: string;
  title: string;
  description: string;
  instructor: string;
  startDate: string;
  endDate: string;
  type: TrainingCourseType;
  status: TrainingCourseStatus;
  capacity?: number;
}

export interface RebuildTrainingEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  courseStartDate?: string;
  courseEndDate?: string;
  courseStatus?: TrainingCourseStatus;
  status: TrainingEnrollmentStatus;
  progress: number;
  enrollmentDate: string;
  completionDate?: string;
}

export interface CreateCourseInput {
  title: string;
  description: string;
  instructor?: string;
  startDate: string;
  endDate: string;
  type: TrainingCourseType;
  status: TrainingCourseStatus;
  capacity?: number;
}

export interface UpdateCourseInput extends CreateCourseInput {
  id: string;
}
