import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiBadgeComponent, BadgeVariant } from '../../../../shared/components/ui-badge/ui-badge.component';
import { ConvexClientService } from '../../../../core/services/convex-client.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { api } from '../../../../../../convex/_generated/api';

@Component({
  selector: 'app-job-list',
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
          <h1 class="heading-accent">Recruitment</h1>
          <p class="text-stone-500 mt-1">Manage job openings and track applicants.</p>
        </div>
        <div class="flex gap-2">
          @if (canManage()) {
            <ui-button variant="outline" routerLink="/recruitment/board">
              <ui-icon name="users" class="w-4 h-4 mr-2"></ui-icon>
              Candidate Board
            </ui-button>
            <ui-button routerLink="/recruitment/jobs/new">
              <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
              Post Job
            </ui-button>
          }
        </div>
      </div>

      <!-- Filters (Optional for now) -->
      <!-- <div class="flex gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
        <button class="px-4 py-2 text-sm font-medium text-primary-600 border-b-2 border-primary-600">All Jobs</button>
        <button class="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700">Open</button>
        <button class="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700">Closed</button>
      </div> -->

      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      } @else if (jobs().length === 0) {
        <div class="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700">
          <div class="w-16 h-16 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <ui-icon name="briefcase" class="w-8 h-8 text-stone-400"></ui-icon>
          </div>
          <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100">No jobs posted yet</h3>
          <p class="text-stone-500 dark:text-stone-400 mt-1 mb-6">Create your first job posting to start recruiting.</p>
          @if (canManage()) {
            <ui-button routerLink="/recruitment/jobs/new">
              Post a Job
            </ui-button>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (job of jobs(); track job._id) {
            <ui-card class="flex flex-col h-full hover:shadow-md transition-shadow cursor-pointer group" (click)="viewJob(job._id)">
              <div class="flex justify-between items-start mb-3">
                <ui-badge [variant]="getStatusVariant(job.status)">
                  {{ job.status | titlecase }}
                </ui-badge>
                @if (canManage()) {
                  <button class="p-1.5 text-stone-400 hover:text-primary-600 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100" (click)="$event.stopPropagation(); editJob(job._id)">
                    <ui-icon name="pencil" class="w-4 h-4"></ui-icon>
                  </button>
                }
              </div>

              <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 mb-1 group-hover:text-primary-600 transition-colors">
                {{ job.title }}
              </h3>

              <div class="text-sm text-stone-500 dark:text-stone-400 mb-4 flex flex-wrap gap-2 items-center">
                <span>{{ job.departmentName }}</span>
                <span class="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600"></span>
                <span>{{ job.locationName }}</span>
                <span class="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600"></span>
                <span>{{ formatType(job.employmentType) }}</span>
              </div>

              <p class="text-sm text-stone-600 dark:text-stone-300 line-clamp-3 mb-6 flex-grow">
                {{ job.description }}
              </p>

              <div class="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-700 mt-auto">
                <span class="text-xs text-stone-500 dark:text-stone-400">
                  Posted {{ job.createdAt | date:'mediumDate' }}
                </span>
                <span class="text-xs font-medium text-stone-700 dark:text-stone-300">
                  {{ job.salaryRange || 'Salary not disclosed' }}
                </span>
              </div>
            </ui-card>
          }
        </div>
      }
    </div>
  `
})
export class JobListComponent implements OnInit {
  private convex = inject(ConvexClientService);
  private authService = inject(AuthService);
  private router = inject(Router);

  jobs = signal<any[]>([]);
  loading = signal(true);
  canManage = this.authService.hasRole(['super_admin', 'admin', 'hr_manager', 'manager']);

  ngOnInit() {
    const client = this.convex.getClient();
    client.onUpdate(api.recruitment.listJobs, {}, (data) => {
      this.jobs.set(data);
      this.loading.set(false);
    });
  }

  viewJob(id: string) {
    // For now, edit link for admins, maybe public view later?
    // Actually, if canManage, go to edit or board filtered by job?
    // Let's make it go to edit if manage, or a simple detail view?
    // For MVP, just edit.
    if (this.canManage()) {
        this.router.navigate(['/recruitment/jobs', id, 'edit']);
    } else {
        // Simple view or apply modal?
        // TODO: Implement apply flow for employees
    }
  }

  editJob(id: string) {
    this.router.navigate(['/recruitment/jobs', id, 'edit']);
  }

  getStatusVariant(status: string): BadgeVariant {
    switch (status) {
      case 'open': return 'success';
      case 'draft': return 'neutral';
      case 'closed': return 'danger';
      default: return 'neutral';
    }
  }

  formatType(type: string): string {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
}
