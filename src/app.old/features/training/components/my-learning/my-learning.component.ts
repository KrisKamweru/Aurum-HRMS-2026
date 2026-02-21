import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiBadgeComponent, BadgeVariant } from '../../../../shared/components/ui-badge/ui-badge.component';
import { UiGridComponent } from '../../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../../shared/components/ui-grid/ui-grid-tile.component';
import { ConvexClientService } from '../../../../core/services/convex-client.service';
import { api } from '../../../../../../convex/_generated/api';

@Component({
  selector: 'app-my-learning',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UiButtonComponent,
    UiIconComponent,
    UiCardComponent,
    UiBadgeComponent,
    UiGridComponent,
    UiGridTileComponent
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="heading-accent">My Learning</h1>
          <p class="text-stone-500 mt-1">Track your enrolled courses and progress.</p>
        </div>
        <ui-button variant="outline" routerLink="/training/catalog">
          <ui-icon name="book-open" class="w-4 h-4 mr-2"></ui-icon>
          Browse Catalog
        </ui-button>
      </div>

      <div class="dash-frame">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="My Learning" variant="compact">
            <div class="tile-body">
              @if (loading()) {
                <div class="flex items-center justify-center py-12">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              } @else if (enrollments().length === 0) {
                <div class="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700">
                  <div class="w-16 h-16 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ui-icon name="academic-cap" class="w-8 h-8 text-stone-400"></ui-icon>
                  </div>
                  <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100">No active enrollments</h3>
                  <p class="text-stone-500 dark:text-stone-400 mt-1 mb-6">You haven't enrolled in any training courses yet.</p>
                  <ui-button routerLink="/training/catalog">
                    Browse Courses
                  </ui-button>
                </div>
              } @else {
                <div class="grid grid-cols-1 gap-6">
                  @for (item of enrollments(); track item._id) {
                    <ui-card class="flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                      <!-- Course Info -->
                      <div class="flex-grow">
                        <div class="flex items-start justify-between mb-2">
                          <h3 class="text-lg font-bold text-stone-900 dark:text-white">{{ item.courseTitle }}</h3>
                          <ui-badge [variant]="getStatusVariant(item.status)">
                            {{ item.status | titlecase }}
                          </ui-badge>
                        </div>

                        <div class="flex flex-wrap gap-4 text-sm text-stone-500 dark:text-stone-400 mb-4">
                          <div class="flex items-center gap-1.5">
                            <ui-icon name="calendar" class="w-4 h-4"></ui-icon>
                            {{ item.courseStartDate | date:'mediumDate' }}
                          </div>
                          @if (item.completionDate) {
                            <div class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <ui-icon name="check-circle" class="w-4 h-4"></ui-icon>
                              Completed {{ item.completionDate | date:'mediumDate' }}
                            </div>
                          }
                        </div>

                        <!-- Progress Bar -->
                        <div class="space-y-1">
                          <div class="flex justify-between text-xs font-medium text-stone-600 dark:text-stone-400">
                            <span>Progress</span>
                            <span>{{ item.progress || 0 }}%</span>
                          </div>
                          <div class="w-full bg-stone-100 dark:bg-stone-700 rounded-full h-2.5">
                            <div class="bg-primary-600 h-2.5 rounded-full transition-all duration-500" [style.width.%]="item.progress || 0"></div>
                          </div>
                        </div>
                      </div>

                      <!-- Actions -->
                      <div class="md:w-48 flex-shrink-0 flex flex-col justify-center gap-2 md:border-l md:border-stone-100 md:dark:border-stone-700 md:pl-6">
                        @if (item.status === 'completed') {
                          <ui-button variant="outline" class="w-full justify-center">
                            <ui-icon name="document-text" class="w-4 h-4 mr-2"></ui-icon>
                            Certificate
                          </ui-button>
                        } @else if (item.status === 'enrolled') {
                           <div class="text-xs text-center text-stone-500 italic">
                              In Progress
                           </div>
                        }
                      </div>
                    </ui-card>
                  }
                </div>
              }
            </div>
          </ui-grid-tile>
        </ui-grid>
      </div>
    </div>
  `
})
export class MyLearningComponent implements OnInit {
  private convex = inject(ConvexClientService);

  enrollments = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    const client = this.convex.getClient();
    client.onUpdate(api.training.getMyEnrollments, {}, (data) => {
      this.enrollments.set(data || []);
      this.loading.set(false);
    });
  }

  getStatusVariant(status: string): BadgeVariant {
    switch (status) {
      case 'enrolled': return 'info';
      case 'completed': return 'success';
      case 'dropped': return 'neutral';
      case 'failed': return 'danger';
      default: return 'neutral';
    }
  }
}
