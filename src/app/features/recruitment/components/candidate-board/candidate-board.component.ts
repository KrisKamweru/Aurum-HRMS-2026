import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { ConvexClientService } from '../../../../core/services/convex-client.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';
import { UiGridComponent } from '../../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../../shared/components/ui-grid/ui-grid-tile.component';
import { Router } from '@angular/router';

interface Application {
  _id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  appliedAt: string;
  rating?: number;
  resumeUrl?: string | null;
}

interface Column {
  id: string;
  title: string;
  status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  items: Application[];
  colorClass: string;
}

@Component({
  selector: 'app-candidate-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    UiButtonComponent,
    UiIconComponent,
    UiGridComponent,
    UiGridTileComponent
  ],
  template: `
    <div class="h-[calc(100vh-8rem)] flex flex-col">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="heading-accent">Candidate Board</h1>
          <p class="text-stone-500 mt-1">Track applications through the recruitment pipeline.</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="relative">
            <select
              [ngModel]="selectedJobId()"
              (ngModelChange)="selectedJobId.set($event)"
              class="pl-3 pr-10 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#8b1e3f] focus:border-transparent transition-all shadow-sm text-sm"
            >
              <option value="">All Jobs</option>
              @for (job of jobs(); track job._id) {
                <option [value]="job._id">{{ job.title }}</option>
              }
            </select>
          </div>
          <ui-button variant="outline" (onClick)="refresh()">
            <ui-icon name="arrow-path" class="w-4 h-4"></ui-icon>
          </ui-button>
        </div>
      </div>

      <!-- Board -->
      <div class="dash-frame flex-1 min-h-0">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="Pipeline" variant="compact">
            <div class="tile-body h-full flex flex-col min-h-0">
              @if (loading()) {
                <div class="flex-1 flex items-center justify-center">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              } @else {
                <div class="flex-1 overflow-x-auto pb-4">
                  <div class="inline-flex gap-4 h-full min-w-full px-1">
                    @for (column of boardColumns(); track column.id) {
                      <div class="w-80 flex-shrink-0 flex flex-col bg-stone-100 dark:bg-stone-900/50 rounded-xl border border-stone-200 dark:border-stone-700 h-full max-h-full">
                        <!-- Column Header -->
                        <div class="p-3 flex items-center justify-between border-b border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 rounded-t-xl sticky top-0 z-10 backdrop-blur-sm">
                          <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full" [ngClass]="column.colorClass"></div>
                            <h3 class="font-bold text-stone-700 dark:text-stone-200 text-sm uppercase tracking-wide">
                              {{ column.title }}
                            </h3>
                          </div>
                          <span class="bg-white dark:bg-stone-800 text-stone-500 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm border border-stone-200 dark:border-stone-700">
                            {{ column.items.length }}
                          </span>
                        </div>

                        <!-- Drop List -->
                        <div
                          cdkDropList
                          [id]="column.id"
                          [cdkDropListData]="column.items"
                          [cdkDropListConnectedTo]="connectedDropLists"
                          (cdkDropListDropped)="drop($event, column.status)"
                          class="flex-1 overflow-y-auto p-2 space-y-3 min-h-[100px]"
                        >
                          @for (item of column.items; track item._id) {
                            <div
                              cdkDrag
                              [cdkDragData]="item"
                              class="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 hover:shadow-md cursor-grab active:cursor-grabbing transition-shadow group relative"
                            >
                              <!-- Card Content -->
                              <div class="flex justify-between items-start mb-2">
                                <div class="font-bold text-stone-800 dark:text-stone-100 line-clamp-1">
                                  {{ item.candidateName }}
                                </div>
                                @if (item.rating) {
                                  <div class="flex text-amber-400 text-xs">
                                    <ui-icon name="star" class="w-3 h-3"></ui-icon>
                                    <span class="ml-0.5 font-bold text-stone-600 dark:text-stone-400">{{ item.rating }}</span>
                                  </div>
                                }
                              </div>

                              <div class="text-xs text-stone-500 dark:text-stone-400 mb-3 truncate">
                                {{ item.jobTitle }}
                              </div>

                              <div class="flex items-center justify-between text-xs text-stone-400 border-t border-stone-100 dark:border-stone-700 pt-3 mt-1">
                                <span>{{ item.appliedAt | date:'mediumDate' }}</span>
                                <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button
                                      class="hover:text-primary-600"
                                      (click)="openApplicationDetails(item)"
                                    >
                                      View
                                    </button>
                                </div>
                              </div>

                              <!-- Drag Placeholder -->
                              <div *cdkDragPlaceholder class="opacity-0"></div>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </ui-grid-tile>
        </ui-grid>
      </div>

      @if (selectedApplication(); as selected) {
        <div class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" (click)="closeApplicationDetails()"></div>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="w-full max-w-lg rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl">
            <div class="flex items-start justify-between p-5 border-b border-stone-200 dark:border-stone-700">
              <div>
                <h2 class="text-lg font-bold text-stone-900 dark:text-stone-100">{{ selected.candidateName }}</h2>
                <p class="text-sm text-stone-500 dark:text-stone-400">{{ selected.jobTitle }}</p>
              </div>
              <button class="text-stone-500 hover:text-stone-700 dark:hover:text-stone-200" (click)="closeApplicationDetails()">
                <ui-icon name="x-mark" class="w-5 h-5"></ui-icon>
              </button>
            </div>

            <div class="p-5 grid grid-cols-2 gap-3 text-sm">
              <div class="text-stone-500 dark:text-stone-400">Status</div>
              <div class="text-stone-800 dark:text-stone-100 capitalize">{{ selected.status }}</div>

              <div class="text-stone-500 dark:text-stone-400">Applied</div>
              <div class="text-stone-800 dark:text-stone-100">{{ selected.appliedAt | date:'medium' }}</div>

              <div class="text-stone-500 dark:text-stone-400">Email</div>
              <div class="text-stone-800 dark:text-stone-100 break-all">{{ selected.candidateEmail || '-' }}</div>

              <div class="text-stone-500 dark:text-stone-400">Rating</div>
              <div class="text-stone-800 dark:text-stone-100">{{ selected.rating ?? '-' }}</div>
            </div>

            <div class="p-5 border-t border-stone-200 dark:border-stone-700 flex flex-wrap gap-2 justify-end">
              <ui-button variant="outline" (onClick)="emailCandidate(selected)">
                Email Candidate
              </ui-button>
              <ui-button variant="outline" (onClick)="openJob(selected)">
                Open Job
              </ui-button>
              @if (selected.resumeUrl) {
                <a
                  [href]="selected.resumeUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Resume
                </a>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Custom scrollbar for horizontal scrolling */
    .overflow-x-auto::-webkit-scrollbar {
      height: 8px;
    }
    .overflow-x-auto::-webkit-scrollbar-track {
      background: transparent;
    }
    .overflow-x-auto::-webkit-scrollbar-thumb {
      background-color: rgba(156, 163, 175, 0.3);
      border-radius: 4px;
    }
    .overflow-x-auto::-webkit-scrollbar-thumb:hover {
      background-color: rgba(156, 163, 175, 0.5);
    }
  `]
})
export class CandidateBoardComponent implements OnInit {
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);
  private router = inject(Router);

  jobs = signal<any[]>([]);
  applications = signal<Application[]>([]);
  loading = signal(true);
  selectedJobId = signal<string>('');
  selectedApplication = signal<Application | null>(null);

  // Define columns structure
  columnsDef: Omit<Column, 'items'>[] = [
    { id: 'col-new', title: 'New', status: 'new', colorClass: 'bg-blue-500' },
    { id: 'col-screening', title: 'Screening', status: 'screening', colorClass: 'bg-indigo-500' },
    { id: 'col-interview', title: 'Interview', status: 'interview', colorClass: 'bg-purple-500' },
    { id: 'col-offer', title: 'Offer Sent', status: 'offer', colorClass: 'bg-amber-500' },
    { id: 'col-hired', title: 'Hired', status: 'hired', colorClass: 'bg-emerald-500' },
    { id: 'col-rejected', title: 'Rejected', status: 'rejected', colorClass: 'bg-red-500' }
  ];

  // IDs for drag and drop connection
  connectedDropLists = this.columnsDef.map(c => c.id);

  // Computed state for the board
  boardColumns = computed(() => {
    const apps = this.applications();
    const jobId = this.selectedJobId();

    // Filter by job if selected
    const filteredApps = jobId
      ? apps.filter(a => (a as any).jobId === jobId)
      : apps;

    return this.columnsDef.map(col => ({
      ...col,
      items: filteredApps.filter(app => app.status === col.status)
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    }));
  });

  constructor() {
    // Effect to reload when job filter changes?
    // Actually we filter client-side since listApplications is fast enough usually,
    // but better to fetch all applications once and filter in computed.
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    const client = this.convex.getClient();

    try {
      // Load Jobs for filter
      const jobs = await client.query(api.recruitment.listJobs, {});
      this.jobs.set(jobs);

      // Load Applications
      // We pass undefined to get all
      this.loadApplications();

    } catch (err) {
      console.error(err);
      this.toast.error('Failed to load board data');
      this.loading.set(false);
    }
  }

  loadApplications() {
    const client = this.convex.getClient();
    // Real-time update for applications
    client.onUpdate(api.recruitment.listApplications, {}, (data) => {
      this.applications.set(data as any[]);
      this.loading.set(false);
    });
  }

  refresh() {
    // Just re-triggers loading UI essentially since onUpdate is live
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 500);
  }

  openApplicationDetails(app: Application) {
    this.selectedApplication.set(app);
  }

  closeApplicationDetails() {
    this.selectedApplication.set(null);
  }

  openJob(app: Application) {
    this.closeApplicationDetails();
    this.router.navigate(['/recruitment/jobs', app.jobId]);
  }

  emailCandidate(app: Application) {
    if (!app.candidateEmail) {
      this.toast.error('No email available for this candidate');
      return;
    }
    window.location.href = `mailto:${app.candidateEmail}`;
  }

  async drop(event: CdkDragDrop<Application[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const item = event.previousContainer.data[event.previousIndex];

      // Optimistic Update locally
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      try {
        await this.convex.getClient().mutation(api.recruitment.updateApplicationStatus, {
          id: item._id as Id<"applications">,
          status: newStatus as any
        });
        this.toast.success(`Application moved to ${newStatus}`);
      } catch (error) {
        console.error('Failed to update status:', error);
        this.toast.error('Failed to move application');
        // Revert move on error would require reloading data or complex undo
        this.refresh(); // Reload to sync
      }
    }
  }
}
