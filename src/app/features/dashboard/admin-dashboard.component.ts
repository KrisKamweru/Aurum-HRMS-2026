import { Component, computed, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { api } from '../../../../convex/_generated/api';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UiButtonComponent,
    UiIconComponent,
    UiCardComponent
  ],
  providers: [DatePipe, DecimalPipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="heading-accent text-2xl">Admin Dashboard</h1>
          <p class="text-stone-500 mt-1">
            Welcome back, {{ user()?.firstName || 'User' }}! Here's what's happening today.
          </p>
        </div>
        <div class="text-sm font-medium text-stone-500 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-lg flex items-center gap-2 w-fit">
           <ui-icon name="calendar" class="w-4 h-4"></ui-icon>
           {{ today | date:'fullDate' }}
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <!-- Total Employees -->
        <ui-card accent="bg-[#8b1e3f]">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-stone-500">Total Employees</p>
              <h3 class="text-3xl font-bold mt-2 text-stone-800">{{ stats()?.totalEmployees || 0 }}</h3>
            </div>
            <div class="p-2 bg-stone-100 rounded-lg text-[#8b1e3f]">
              <ui-icon name="users" class="w-6 h-6"></ui-icon>
            </div>
          </div>
          <div class="mt-4 text-xs text-stone-500">
            <span class="text-green-600 font-medium">{{ stats()?.activeEmployees || 0 }} Active</span>
          </div>
        </ui-card>

        <!-- On Leave -->
        <ui-card accent="bg-amber-500">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-stone-500">On Leave</p>
              <h3 class="text-3xl font-bold mt-2 text-stone-800">{{ stats()?.onLeave || 0 }}</h3>
            </div>
            <div class="p-2 bg-amber-50 rounded-lg text-amber-600">
              <ui-icon name="calendar" class="w-6 h-6"></ui-icon>
            </div>
          </div>
          <div class="mt-4 text-xs text-stone-500">
            Current absentees
          </div>
        </ui-card>

        <!-- Departments -->
        <ui-card accent="bg-indigo-500">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-stone-500">Departments</p>
              <h3 class="text-3xl font-bold mt-2 text-stone-800">{{ stats()?.departments || 0 }}</h3>
            </div>
            <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <ui-icon name="building-office" class="w-6 h-6"></ui-icon>
            </div>
          </div>
          <div class="mt-4 text-xs text-stone-500">
             Operational units
          </div>
        </ui-card>

        <!-- Pending Actions -->
        <ui-card accent="bg-red-500">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-stone-500">Pending Actions</p>
              <h3 class="text-3xl font-bold mt-2 text-stone-800">
                {{ (stats()?.pendingLeaveCount || 0) + (stats()?.pendingResignationCount || 0) + (stats()?.pendingJoinRequestCount || 0) }}
              </h3>
            </div>
            <div class="p-2 bg-red-50 rounded-lg text-red-600">
              <ui-icon name="bell" class="w-6 h-6"></ui-icon>
            </div>
          </div>
          <div class="mt-4 text-xs text-stone-500">
             Requires attention
          </div>
        </ui-card>
      </div>

      <!-- Action Items Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Pending Leave Requests -->
        <div class="card p-0 overflow-hidden">
          <div class="p-4 border-b border-stone-100 flex items-center justify-between">
             <h3 class="font-bold text-[#8b1e3f] flex items-center gap-2">
                <ui-icon name="calendar" class="w-4 h-4"></ui-icon> Pending Leave Requests
             </h3>
             <a routerLink="/leave-requests" class="text-xs font-medium text-stone-500 hover:text-[#8b1e3f]">View All</a>
          </div>

          <div class="divide-y divide-stone-100">
             @for (req of dashboardData()?.pendingLeaves; track req._id) {
               <div class="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between group">
                  <div>
                     <div class="font-medium text-sm text-stone-800">{{ req.employeeName }}</div>
                     <div class="text-xs text-stone-500 mt-1 flex items-center gap-2">
                        <span class="px-1.5 py-0.5 rounded bg-stone-200 text-stone-600 font-semibold uppercase text-[10px]">{{ req.type }}</span>
                        <span>{{ req.startDate | date:'MMM d' }} - {{ req.endDate | date:'MMM d' }}</span>
                     </div>
                  </div>
                  <a routerLink="/leave-requests" class="text-xs font-medium text-[#8b1e3f] opacity-0 group-hover:opacity-100 transition-opacity">Review</a>
               </div>
             } @empty {
               <div class="p-8 text-center text-stone-400 italic text-sm">No pending leave requests.</div>
             }
          </div>
        </div>

        <!-- Pending Resignations -->
        <div class="card p-0 overflow-hidden">
          <div class="p-4 border-b border-stone-100 flex items-center justify-between">
             <h3 class="font-bold text-red-600 flex items-center gap-2">
                <ui-icon name="user" class="w-4 h-4"></ui-icon> Pending Resignations
             </h3>
             <a routerLink="/employees" class="text-xs font-medium text-stone-500 hover:text-red-600">View Employees</a>
          </div>

          <div class="divide-y divide-stone-100">
             @for (res of dashboardData()?.pendingResignations; track res._id) {
               <div class="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between group">
                  <div>
                     <div class="font-medium text-sm text-stone-800">{{ res.employeeName }}</div>
                     <div class="text-xs text-stone-500 mt-1">
                        Last Day: {{ res.lastWorkingDay | date:'mediumDate' }}
                     </div>
                     <div class="text-xs text-stone-400 italic mt-0.5">"{{ res.reason | slice:0:40 }}..."</div>
                  </div>
                  <a [routerLink]="['/employees', res.employeeId]" class="text-xs font-medium text-[#8b1e3f] opacity-0 group-hover:opacity-100 transition-opacity">Details</a>
               </div>
             } @empty {
               <div class="p-8 text-center text-stone-400 italic text-sm">No pending resignations.</div>
             }
          </div>
        </div>

        <!-- Pending User Requests -->
        @if (stats()?.pendingJoinRequestCount > 0) {
          <div class="card p-0 overflow-hidden">
            <div class="p-4 border-b border-stone-100 flex items-center justify-between">
               <h3 class="font-bold text-emerald-600 flex items-center gap-2">
                  <ui-icon name="user-plus" class="w-4 h-4"></ui-icon> Pending User Requests
                  <span class="ml-2 px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">{{ stats()?.pendingJoinRequestCount }}</span>
               </h3>
            </div>

            <div class="divide-y divide-stone-100">
               @for (req of dashboardData()?.pendingJoinRequests; track req._id) {
                 <div class="p-4 hover:bg-stone-50 transition-colors">
                    <div class="flex items-start justify-between gap-4">
                       <div class="flex items-center gap-3">
                          <div class="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 overflow-hidden flex-shrink-0">
                            <img *ngIf="req.requesterImage" [src]="req.requesterImage" class="w-full h-full object-cover" alt="">
                            <ui-icon *ngIf="!req.requesterImage" name="user" class="w-5 h-5"></ui-icon>
                          </div>
                          <div>
                             <div class="font-medium text-sm text-stone-800">{{ req.requesterName }}</div>
                             <div class="text-xs text-stone-500">{{ req.requesterEmail }}</div>
                             <div class="text-xs text-stone-400 mt-1" *ngIf="req.note">"{{ req.note | slice:0:50 }}{{ req.note.length > 50 ? '...' : '' }}"</div>
                          </div>
                       </div>
                       <div class="flex items-center gap-2 flex-shrink-0">
                          <ui-button
                            variant="ghost"
                            size="sm"
                            class="text-red-600 hover:bg-red-50"
                            [loading]="processingRequestId() === req._id && processingAction() === 'reject'"
                            (onClick)="rejectRequest(req._id)"
                          >
                            Reject
                          </ui-button>
                          <ui-button
                            variant="primary"
                            size="sm"
                            [loading]="processingRequestId() === req._id && processingAction() === 'approve'"
                            (onClick)="approveRequest(req._id)"
                          >
                            Approve
                          </ui-button>
                       </div>
                    </div>
                 </div>
               }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);
  private authService = inject(AuthService);

  today = new Date();
  user = computed(() => this.authService.getUser()());

  dashboardData = signal<any>(null);
  stats = computed(() => this.dashboardData()?.stats);
  processingRequestId = signal<string | null>(null);
  processingAction = signal<'approve' | 'reject' | null>(null);

  private unsubscribe: (() => void) | null = null;

  ngOnInit() {
    const client = this.convexService.getClient();
    this.unsubscribe = client.onUpdate(api.dashboard.getStats, {}, (data) => {
      this.dashboardData.set(data);
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  async approveRequest(requestId: string) {
    this.processingRequestId.set(requestId);
    this.processingAction.set('approve');
    try {
      await this.convexService.getClient().mutation(api.onboarding.approveJoinRequest, {
        requestId: requestId as any,
        role: 'employee'
      });
    } catch (err: any) {
      alert(err.message || 'Failed to approve request');
    } finally {
      this.processingRequestId.set(null);
      this.processingAction.set(null);
    }
  }

  async rejectRequest(requestId: string) {
    const reason = prompt('Rejection reason (optional):');
    this.processingRequestId.set(requestId);
    this.processingAction.set('reject');
    try {
      await this.convexService.getClient().mutation(api.onboarding.rejectJoinRequest, {
        requestId: requestId as any,
        reason: reason || undefined
      });
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    } finally {
      this.processingRequestId.set(null);
      this.processingAction.set(null);
    }
  }
}
