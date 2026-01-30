import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiBadgeComponent, BadgeVariant } from '../../../../shared/components/ui-badge/ui-badge.component';
import { ConvexClientService } from '../../../../core/services/convex-client.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UiButtonComponent,
    UiIconComponent,
    UiCardComponent,
    UiBadgeComponent
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="heading-accent">Course Catalog</h1>
          <p class="text-stone-500 mt-1">Browse and enroll in available training courses.</p>
        </div>
        <div class="flex gap-2">
          <ui-button variant="outline" routerLink="/training/my-learning">
            <ui-icon name="academic-cap" class="w-4 h-4 mr-2"></ui-icon>
            My Learning
          </ui-button>
          @if (canManage()) {
            <ui-button routerLink="/training/courses/new">
              <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
              Create Course
            </ui-button>
          }
        </div>
      </div>

      <!-- Filters (Optional placeholder) -->
      <!-- <div class="flex gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
        <button class="px-4 py-2 text-sm font-medium text-primary-600 border-b-2 border-primary-600">All Courses</button>
        <button class="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700">Upcoming</button>
        <button class="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700">Online</button>
      </div> -->

      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      } @else if (courses().length === 0) {
        <div class="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700">
          <div class="w-16 h-16 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <ui-icon name="academic-cap" class="w-8 h-8 text-stone-400"></ui-icon>
          </div>
          <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100">No courses available</h3>
          <p class="text-stone-500 dark:text-stone-400 mt-1 mb-6">Check back later for new training opportunities.</p>
          @if (canManage()) {
            <ui-button routerLink="/training/courses/new">
              Create a Course
            </ui-button>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (course of courses(); track course._id) {
            <ui-card class="flex flex-col h-full hover:shadow-md transition-shadow group">
              <div class="flex justify-between items-start mb-3">
                <ui-badge [variant]="getStatusVariant(course.status)">
                  {{ course.status | titlecase }}
                </ui-badge>
                @if (canManage()) {
                  <button class="p-1.5 text-stone-400 hover:text-primary-600 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100" (click)="editCourse(course._id)">
                    <ui-icon name="pencil" class="w-4 h-4"></ui-icon>
                  </button>
                }
              </div>

              <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 mb-1 group-hover:text-primary-600 transition-colors">
                {{ course.title }}
              </h3>

              <div class="text-sm text-stone-500 dark:text-stone-400 mb-4 flex flex-wrap gap-2 items-center">
                <span>{{ course.type | titlecase }}</span>
                @if (course.instructor) {
                  <span class="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600"></span>
                  <span>{{ course.instructor }}</span>
                }
              </div>

              <p class="text-sm text-stone-600 dark:text-stone-300 line-clamp-3 mb-6 flex-grow">
                {{ course.description }}
              </p>

              <div class="mt-auto space-y-4">
                <div class="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 border-t border-stone-100 dark:border-stone-700 pt-4">
                  <div class="flex items-center gap-1">
                    <ui-icon name="calendar" class="w-3 h-3"></ui-icon>
                    {{ course.startDate | date:'mediumDate' }}
                  </div>
                  @if (course.capacity) {
                     <div class="flex items-center gap-1">
                       <ui-icon name="users" class="w-3 h-3"></ui-icon>
                       {{ course.capacity }} max
                     </div>
                  }
                </div>

                <ui-button
                  [fullWidth]="true"
                  (onClick)="enroll(course._id)"
                  [disabled]="enrollingId() === course._id || course.status === 'completed' || course.status === 'cancelled'"
                  [loading]="enrollingId() === course._id"
                >
                  Enroll Now
                </ui-button>
              </div>
            </ui-card>
          }
        </div>
      }
    </div>
  `
})
export class CourseListComponent implements OnInit {
  private convex = inject(ConvexClientService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  courses = signal<any[]>([]);
  loading = signal(true);
  enrollingId = signal<string | null>(null);
  canManage = this.authService.hasRole(['super_admin', 'admin', 'hr_manager', 'manager']);

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    const client = this.convex.getClient();
    client.onUpdate(api.training.listCourses, {}, (data) => {
      this.courses.set(data || []);
      this.loading.set(false);
    });
  }

  editCourse(id: string) {
    this.router.navigate(['/training/courses', id, 'edit']);
  }

  async enroll(courseId: string) {
    this.enrollingId.set(courseId);
    try {
      await this.convex.getClient().mutation(api.training.enrollEmployee, {
        courseId: courseId as Id<"training_courses">
      });
      this.toast.success('Successfully enrolled in course');
      this.router.navigate(['/training/my-learning']);
    } catch (err: any) {
      console.error(err);
      this.toast.error(err.message || 'Failed to enroll');
    } finally {
      this.enrollingId.set(null);
    }
  }

  getStatusVariant(status: string): BadgeVariant {
    switch (status) {
      case 'upcoming': return 'info';
      case 'in_progress': return 'success';
      case 'completed': return 'neutral';
      case 'cancelled': return 'danger';
      default: return 'neutral';
    }
  }
}
