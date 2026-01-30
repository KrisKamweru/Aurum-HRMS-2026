import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { api } from '../../../../convex/_generated/api';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiBadgeComponent } from '../../shared/components/ui-badge/ui-badge.component';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, UiCardComponent, UiButtonComponent, UiIconComponent, UiBadgeComponent],
  providers: [DatePipe],
  template: `
    <div class="space-y-8">
      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      } @else if (!data()?.hasEmployeeProfile) {
        <!-- No Employee Profile State -->
        <ui-card>
          <div class="text-center py-12">
            <svg class="w-40 h-40 mx-auto mb-6 dark:opacity-90" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="dashboard-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#8b1e3f" stop-opacity="0.05" class="dark:stop-opacity-20"/>
                  <stop offset="100%" stop-color="#b8956b" stop-opacity="0.05" class="dark:stop-opacity-20"/>
                </linearGradient>
                <linearGradient id="dashboard-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#8b1e3f" class="dark:stop-color-burgundy-300"/>
                  <stop offset="100%" stop-color="#b8956b" class="dark:stop-color-burgundy-200"/>
                </linearGradient>
              </defs>
              <!-- Background Elements -->
              <circle cx="80" cy="80" r="70" fill="url(#dashboard-gradient)" stroke="#e7e5e4" class="dark:stroke-stone-600" stroke-width="1"/>
              <circle cx="80" cy="80" r="55" stroke="url(#dashboard-stroke)" stroke-width="1.5" stroke-dasharray="6 6" stroke-linecap="round" opacity="0.4" class="dark:opacity-60" />

              <!-- Abstract Person -->
              <path d="M80 95C96.5685 95 110 108.431 110 125H50C50 108.431 63.4315 95 80 95Z" fill="white" class="dark:fill-stone-800 dark:stroke-stone-500" stroke="#d6d3d1" stroke-width="2"/>
              <circle cx="80" cy="65" r="20" fill="white" class="dark:fill-stone-800 dark:stroke-stone-500" stroke="#d6d3d1" stroke-width="2"/>

              <!-- Disconnected/Unlinked Status Badge -->
              <g filter="url(#shadow)">
                <circle cx="110" cy="50" r="16" fill="white" class="dark:fill-stone-800 dark:stroke-stone-500" stroke="url(#dashboard-stroke)" stroke-width="2"/>
                <path d="M106 50L114 50" stroke="#8b1e3f" class="dark:stroke-burgundy-300" stroke-width="2" stroke-linecap="round"/>
                <path d="M110 46L110 54" stroke="#8b1e3f" class="dark:stroke-burgundy-300" stroke-width="2" stroke-linecap="round" transform="rotate(45 110 50)"/>
              </g>
              <defs>
                <filter id="shadow" x="90" y="30" width="40" height="40" filterUnits="userSpaceOnUse">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.1" class="dark:flood-opacity-50"/>
                </filter>
              </defs>
            </svg>

            <h3 class="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">Profile Not Found</h3>
            <p class="text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-8 leading-relaxed">
              Your user account is not linked to an employee profile yet. This usually means your profile is being set up by HR or requires verification.
            </p>
            <ui-button variant="outline" size="sm" class="border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:text-[#8b1e3f] dark:hover:text-[#fce7eb] hover:border-[#8b1e3f] dark:hover:border-[#8b1e3f]">
              <ui-icon name="envelope" class="w-4 h-4 mr-2"></ui-icon>
              Contact Support
            </ui-button>
          </div>
        </ui-card>
      } @else {
        <!-- Welcome Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="heading-accent text-2xl dark:text-white">Welcome back, {{ data()?.employee?.firstName }}!</h1>
            <p class="text-stone-500 dark:text-stone-400 mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span>{{ data()?.employee?.designationName || 'Employee' }}</span>
              <span class="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600"></span>
              <span>{{ data()?.employee?.departmentName || 'General' }}</span>
              <span class="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600"></span>
              <span class="text-stone-400 dark:text-stone-500 text-xs uppercase font-semibold tracking-wide">{{ data()?.employee?.tenure }}</span>
            </p>
          </div>

          <div class="flex items-center gap-4">
            <div class="text-right hidden md:block">
              <div class="text-sm font-bold text-stone-700 dark:text-stone-200">{{ today | date:'EEEE' }}</div>
              <div class="text-xs text-stone-500 dark:text-stone-400">{{ today | date:'longDate' }}</div>
            </div>
            <ui-button variant="primary" routerLink="/leave-requests" class="w-full md:w-auto justify-center">
              <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
              Request Leave
            </ui-button>
          </div>
        </div>

        <!-- Leave Balance Cards -->
        <section>
          <h2 class="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <ui-icon name="calendar" class="w-5 h-5 text-stone-400 dark:text-stone-500"></ui-icon>
            Leave Balance
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
            <!-- Vacation -->
            <ui-card accent="bg-sky-500">
              <div class="flex justify-between items-start mb-4">
                <span class="font-medium text-stone-600 dark:text-stone-300">Vacation</span>
                <span class="text-xs font-semibold bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-2 py-1 rounded-full">
                  {{ data()?.leaveBalance?.vacation?.remaining }} days left
                </span>
              </div>
              <div class="flex items-end gap-1 mb-2">
                <span class="text-3xl font-bold text-stone-800 dark:text-stone-100">{{ data()?.leaveBalance?.vacation?.remaining }}</span>
                <span class="text-sm text-stone-400 dark:text-stone-500 mb-1">/ {{ data()?.leaveBalance?.vacation?.entitled }}</span>
              </div>
              <!-- Progress Bar -->
              <div class="h-2 w-full bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                <div class="h-full bg-sky-500 rounded-full"
                     [style.width.%]="getPercentage(data()?.leaveBalance?.vacation?.remaining, data()?.leaveBalance?.vacation?.entitled)"></div>
              </div>
            </ui-card>

            <!-- Sick Leave -->
            <ui-card accent="bg-emerald-500">
              <div class="flex justify-between items-start mb-4">
                <span class="font-medium text-stone-600 dark:text-stone-300">Sick Leave</span>
                <span class="text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                  {{ data()?.leaveBalance?.sick?.remaining }} days left
                </span>
              </div>
              <div class="flex items-end gap-1 mb-2">
                <span class="text-3xl font-bold text-stone-800 dark:text-stone-100">{{ data()?.leaveBalance?.sick?.remaining }}</span>
                <span class="text-sm text-stone-400 dark:text-stone-500 mb-1">/ {{ data()?.leaveBalance?.sick?.entitled }}</span>
              </div>
              <div class="h-2 w-full bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 rounded-full"
                     [style.width.%]="getPercentage(data()?.leaveBalance?.sick?.remaining, data()?.leaveBalance?.sick?.entitled)"></div>
              </div>
            </ui-card>

            <!-- Personal Leave -->
            <ui-card accent="bg-amber-500">
              <div class="flex justify-between items-start mb-4">
                <span class="font-medium text-stone-600 dark:text-stone-300">Personal</span>
                <span class="text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                  {{ data()?.leaveBalance?.personal?.remaining }} days left
                </span>
              </div>
              <div class="flex items-end gap-1 mb-2">
                <span class="text-3xl font-bold text-stone-800 dark:text-stone-100">{{ data()?.leaveBalance?.personal?.remaining }}</span>
                <span class="text-sm text-stone-400 dark:text-stone-500 mb-1">/ {{ data()?.leaveBalance?.personal?.entitled }}</span>
              </div>
              <div class="h-2 w-full bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                <div class="h-full bg-amber-500 rounded-full"
                     [style.width.%]="getPercentage(data()?.leaveBalance?.personal?.remaining, data()?.leaveBalance?.personal?.entitled)"></div>
              </div>
            </ui-card>
          </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column (2 cols wide) -->
          <div class="lg:col-span-2 space-y-8">
            <!-- My Leave Requests -->
            <section>
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                  <ui-icon name="calendar" class="w-5 h-5 text-stone-400 dark:text-stone-500"></ui-icon>
                  Recent Requests
                </h2>
                <a routerLink="/leave-requests" class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">View All</a>
              </div>

              <!-- Next Upcoming Leave Highlight -->
              @if (data()?.upcomingLeave?.length > 0) {
                @let nextLeave = data()?.upcomingLeave[0];
                <div class="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl p-4 flex items-center gap-4">
                   <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                     <ui-icon name="calendar" class="w-6 h-6"></ui-icon>
                   </div>
                   <div class="flex-grow">
                     <div class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Upcoming Leave</div>
                     <div class="font-bold text-stone-800 dark:text-stone-100 text-lg">
                       {{ nextLeave.startDate | date:'mediumDate' }} - {{ nextLeave.endDate | date:'mediumDate' }}
                     </div>
                     <div class="text-sm text-stone-500 dark:text-stone-400">
                       {{ nextLeave.type | titlecase }} • {{ nextLeave.days }} days
                     </div>
                   </div>
                </div>
              }

              <div class="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden shadow-sm min-h-[200px] flex flex-col">
                @if (data()?.recentRequests?.length === 0) {
                  <div class="flex-grow flex flex-col items-center justify-center p-8 text-center">
                    <svg class="w-24 h-24 mb-4 opacity-50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="20" y="20" width="60" height="60" rx="8" stroke="#d6d3d1" class="dark:stroke-stone-600" stroke-width="2" stroke-dasharray="4 4"/>
                      <circle cx="50" cy="50" r="12" stroke="#d6d3d1" class="dark:stroke-stone-600" stroke-width="2"/>
                      <path d="M50 38V45" stroke="#d6d3d1" class="dark:stroke-stone-600" stroke-width="2" stroke-linecap="round"/>
                      <path d="M50 50L56 56" stroke="#d6d3d1" class="dark:stroke-stone-600" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <p class="text-stone-500 dark:text-stone-400 font-medium">No recent leave requests</p>
                    <p class="text-stone-400 dark:text-stone-500 text-sm mt-1">Your leave history will appear here</p>
                    <button routerLink="/leave-requests" class="mt-4 text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline">
                      Make a request
                    </button>
                  </div>
                } @else {
                  <div class="divide-y divide-stone-100 dark:divide-stone-700">
                    @for (req of data()?.recentRequests; track req._id) {
                      <div class="p-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors">
                        <div class="flex items-center gap-4">
                          <div class="w-10 h-10 rounded-full flex items-center justify-center"
                               [ngClass]="getIconBgClass(req.status)">
                            <ui-icon [name]="getIconName(req.status)" class="w-5 h-5"></ui-icon>
                          </div>
                          <div>
                            <div class="font-medium text-stone-800 dark:text-stone-200 capitalize">{{ req.type }} Leave</div>
                            <div class="text-xs text-stone-500 dark:text-stone-400">
                              {{ req.startDate | date:'MMM d' }} - {{ req.endDate | date:'MMM d' }} • {{ req.days }} days
                            </div>
                          </div>
                        </div>
                        <ui-badge [variant]="getBadgeVariant(req.status)">
                          {{ req.status | titlecase }}
                        </ui-badge>
                      </div>
                    }
                  </div>
                }
              </div>
            </section>
          </div>

          <!-- Right Column -->
          <div class="space-y-8">
            <!-- Time & Attendance Widget -->
            <ui-card class="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-stone-800 border-indigo-100 dark:border-indigo-800/30">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
                  <ui-icon name="clock" class="w-4 h-4 text-indigo-500 dark:text-indigo-400"></ui-icon>
                  Time Clock
                </h3>
                <a routerLink="/attendance" class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">View History</a>
              </div>

              <!-- Current Time Display -->
              <div class="text-center mb-4">
                <div class="text-3xl font-bold text-stone-800 dark:text-stone-100 tabular-nums">
                  {{ currentTime() | date:'HH:mm:ss' }}
                </div>
                <div class="text-xs text-stone-500 dark:text-stone-400">{{ currentTime() | date:'EEEE, MMM d' }}</div>
              </div>

              <!-- Clock Status -->
              @if (attendanceStatus()) {
                <div class="bg-white/80 dark:bg-stone-800/80 rounded-lg p-3 mb-4 border border-indigo-100 dark:border-indigo-800/30">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-medium text-stone-500 dark:text-stone-400">Clocked In</span>
                    <span class="text-sm font-bold text-indigo-700 dark:text-indigo-300">{{ formatTime(attendanceStatus()!.clockIn) }}</span>
                  </div>
                  @if (attendanceStatus()!.clockOut) {
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-stone-500 dark:text-stone-400">Clocked Out</span>
                      <span class="text-sm font-bold text-indigo-700 dark:text-indigo-300">{{ formatTime(attendanceStatus()!.clockOut) }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-medium text-stone-500 dark:text-stone-400">Work Time</span>
                      <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ formatDuration(attendanceStatus()!.workMinutes) }}</span>
                    </div>
                  } @else {
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-medium text-stone-500 dark:text-stone-400">Status</span>
                      <span class="text-xs font-bold uppercase px-2 py-0.5 rounded-full"
                            [ngClass]="{
                              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400': attendanceStatus()!.status === 'present',
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': attendanceStatus()!.status === 'late'
                            }">
                        {{ attendanceStatus()!.status }}
                      </span>
                    </div>
                  }
                </div>

                <!-- Clock Out Button -->
                @if (!attendanceStatus()!.clockOut) {
                  <button
                    (click)="clockOut()"
                    [disabled]="isClockingOut()"
                    class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-semibold shadow-md shadow-red-200 dark:shadow-none hover:shadow-lg hover:shadow-red-300 dark:hover:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    @if (isClockingOut()) {
                      <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Clocking Out...
                    } @else {
                      <ui-icon name="arrow-right-on-rectangle" class="w-5 h-5"></ui-icon>
                      Clock Out
                    }
                  </button>
                } @else {
                  <div class="text-center text-sm text-stone-500 dark:text-stone-400 py-2">
                    You've completed today's shift
                  </div>
                }
              } @else {
                <!-- Not Clocked In -->
                <div class="text-center mb-4 py-2">
                  <div class="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500 flex items-center justify-center mx-auto mb-2">
                    <ui-icon name="clock" class="w-6 h-6"></ui-icon>
                  </div>
                  <p class="text-sm text-stone-500 dark:text-stone-400">Not clocked in yet</p>
                </div>
                <button
                  (click)="clockIn()"
                  [disabled]="isClockingIn()"
                  class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md shadow-emerald-200 dark:shadow-none hover:shadow-lg hover:shadow-emerald-300 dark:hover:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  @if (isClockingIn()) {
                    <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Clocking In...
                  } @else {
                    <ui-icon name="clock" class="w-5 h-5"></ui-icon>
                    Clock In
                  }
                </button>
              }
            </ui-card>

            <!-- Team Status -->
            <ui-card>
              <h3 class="font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
                <ui-icon name="users" class="w-4 h-4 text-stone-400 dark:text-stone-500"></ui-icon>
                Team Pulse
              </h3>

              <div class="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-4 mb-4">
                @if (data()?.teammatesOnLeave > 0) {
                  <div class="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-1">{{ data()?.teammatesOnLeave }}</div>
                  <div class="text-sm text-stone-500 dark:text-stone-400">Teammates on leave today</div>
                } @else {
                  <div class="flex flex-col items-center py-2 text-center">
                    <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-2">
                      <ui-icon name="check" class="w-4 h-4"></ui-icon>
                    </div>
                    <span class="text-sm font-medium text-stone-700 dark:text-stone-300">All teammates present</span>
                  </div>
                }
              </div>
            </ui-card>

            <!-- Quick Actions -->
            <ui-card>
              <h3 class="font-bold text-stone-800 dark:text-stone-100 mb-4">Quick Actions</h3>
              <div class="space-y-2">
                <button routerLink="/profile" class="w-full text-left px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all flex items-center justify-between group">
                  <span class="text-sm font-medium text-stone-700 dark:text-stone-300 group-hover:text-primary-700 dark:group-hover:text-primary-400">View My Profile</span>
                  <ui-icon name="chevron-right" class="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-primary-500 dark:group-hover:text-primary-400"></ui-icon>
                </button>

                @if (data()?.latestPayslip) {
                  <button [routerLink]="['/payroll/slip', data()?.latestPayslip._id]" class="w-full text-left px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all flex items-center justify-between group">
                    <div class="flex items-center gap-3">
                      <div class="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded text-emerald-600 dark:text-emerald-400">
                        <ui-icon name="banknotes" class="w-4 h-4"></ui-icon>
                      </div>
                      <div>
                        <span class="text-sm font-medium text-stone-700 dark:text-stone-300 block">Latest Payslip</span>
                        <span class="text-xs text-stone-500 dark:text-stone-400">{{ getMonthName(data()?.latestPayslip.month) }} {{ data()?.latestPayslip.year }}</span>
                      </div>
                    </div>
                    <ui-icon name="chevron-right" class="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400"></ui-icon>
                  </button>
                } @else {
                  <button class="w-full text-left px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 cursor-not-allowed opacity-60 flex items-center justify-between">
                    <span class="text-sm font-medium text-stone-500 dark:text-stone-400">View Payslip</span>
                    <ui-icon name="lock-closed" class="w-4 h-4 text-stone-400 dark:text-stone-500"></ui-icon>
                  </button>
                }
              </div>
            </ui-card>

            <!-- Recognition -->
            @if (data()?.recentAwards?.length > 0) {
              <ui-card class="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-stone-800 border-amber-100 dark:border-amber-800/30">
                <h3 class="font-bold text-amber-800 dark:text-amber-200 mb-4 flex items-center gap-2">
                  <ui-icon name="star" class="w-4 h-4 text-amber-500 dark:text-amber-400"></ui-icon>
                  Recent Awards
                </h3>
                <div class="space-y-3">
                  @for (award of data()?.recentAwards; track award._id) {
                    <div class="flex items-center gap-3">
                       <div class="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                         <ui-icon name="star" class="w-4 h-4"></ui-icon>
                       </div>
                       <div>
                         <div class="text-sm font-bold text-stone-800 dark:text-stone-100">{{ award.title }}</div>
                         <div class="text-xs text-stone-500 dark:text-stone-400">{{ award.date | date:'mediumDate' }}</div>
                       </div>
                    </div>
                  }
                </div>
              </ui-card>
            }

            <!-- Warnings -->
            @if (data()?.recentWarnings?.length > 0) {
              <ui-card class="bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-stone-800 border-red-100 dark:border-red-800/30">
                <h3 class="font-bold text-red-800 dark:text-red-200 mb-4 flex items-center gap-2">
                  <ui-icon name="exclamation-triangle" class="w-4 h-4 text-red-500 dark:text-red-400"></ui-icon>
                  Recent Alerts
                </h3>
                <div class="space-y-3">
                  @for (warning of data()?.recentWarnings; track warning._id) {
                    <div class="p-3 bg-white/50 dark:bg-stone-800/50 rounded-lg border border-red-100 dark:border-red-800/30">
                       <div class="flex justify-between items-start mb-1">
                         <span class="text-sm font-bold text-red-800 dark:text-red-200">{{ warning.subject }}</span>
                         <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">{{ warning.severity }}</span>
                       </div>
                       <div class="text-xs text-red-700 dark:text-red-300 line-clamp-2">{{ warning.description }}</div>
                       <div class="text-[10px] text-red-500 dark:text-red-400 mt-2 text-right">{{ warning.issueDate | date:'mediumDate' }}</div>
                    </div>
                  }
                </div>
              </ui-card>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class EmployeeDashboardComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);
  private toastService = inject(ToastService);

  today = new Date();
  isLoading = signal(true);
  data = signal<any>(null);
  attendanceStatus = signal<any>(null);
  isClockingIn = signal(false);
  isClockingOut = signal(false);
  currentTime = signal(new Date());

  private unsubscribe: (() => void) | null = null;
  private attendanceUnsubscribe: (() => void) | null = null;
  private clockInterval: any = null;

  ngOnInit() {
    const client = this.convexService.getClient();
    this.unsubscribe = client.onUpdate(api.dashboard.getEmployeeStats, {}, (result) => {
      this.data.set(result);
      this.isLoading.set(false);
    });

    // Subscribe to attendance status
    this.attendanceUnsubscribe = client.onUpdate(api.attendance.getTodayStatus, {}, (result) => {
      this.attendanceStatus.set(result);
    });

    // Update clock every second
    this.clockInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.attendanceUnsubscribe) {
      this.attendanceUnsubscribe();
    }
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  async clockIn() {
    this.isClockingIn.set(true);
    try {
      const client = this.convexService.getClient();
      await client.mutation(api.attendance.clockIn, {});
      this.toastService.success('Clocked in successfully!');
    } catch (error: any) {
      this.toastService.error(error.message || 'Failed to clock in');
    } finally {
      this.isClockingIn.set(false);
    }
  }

  async clockOut() {
    this.isClockingOut.set(true);
    try {
      const client = this.convexService.getClient();
      await client.mutation(api.attendance.clockOut, {});
      this.toastService.success('Clocked out successfully!');
    } catch (error: any) {
      this.toastService.error(error.message || 'Failed to clock out');
    } finally {
      this.isClockingOut.set(false);
    }
  }

  formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDuration(minutes: number | undefined): string {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  getPercentage(remaining: number, entitled: number): number {
    if (!entitled) return 0;
    return (remaining / entitled) * 100;
  }

  getBadgeVariant(status: string): any {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      case 'cancelled': return 'neutral';
      default: return 'neutral';
    }
  }

  getIconName(status: string): string {
    switch (status) {
      case 'approved': return 'check';
      case 'pending': return 'information-circle'; // Fallback for clock
      case 'rejected': return 'x-mark';
      case 'cancelled': return 'trash'; // Fallback for minus
      default: return 'information-circle';
    }
  }

  getIconBgClass(status: string): string {
    switch (status) {
      case 'approved': return 'bg-emerald-50 text-emerald-600';
      case 'pending': return 'bg-amber-50 text-amber-600';
      case 'rejected': return 'bg-red-50 text-red-600';
      case 'cancelled': return 'bg-stone-50 text-stone-600';
      default: return 'bg-stone-50 text-stone-600';
    }
  }

  getMonthName(month: number): string {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
  }
}
