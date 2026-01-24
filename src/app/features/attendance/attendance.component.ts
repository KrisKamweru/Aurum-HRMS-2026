import { Component, computed, effect, inject, OnDestroy, signal, resource } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiBadgeComponent, BadgeVariant } from '../../shared/components/ui-badge/ui-badge.component';
import { UiDataTableComponent, TableColumn } from '../../shared/components/ui-data-table/ui-data-table.component';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { api } from '../../../../convex/_generated/api';

interface AttendanceSummary {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalWorkMinutes: number;
  avgWorkMinutes: number;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UiCardComponent,
    UiIconComponent,
    UiButtonComponent,
    UiBadgeComponent,
    UiDataTableComponent
  ],
  providers: [DatePipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-stone-800 dark:text-stone-100">Time & Attendance</h1>
          <p class="text-stone-500 dark:text-stone-400 mt-1">Track your work hours and attendance history</p>
        </div>

        <div class="flex items-center gap-4">
          @if (canManage()) {
            <ui-button variant="outline" routerLink="team">
              <ui-icon name="users" class="w-4 h-4 mr-2"></ui-icon>
              Team View
            </ui-button>
          }

          <div class="text-right pl-4 border-l border-stone-200 dark:border-stone-700">
            <div class="text-3xl font-mono font-bold text-[#8b1e3f] dark:text-[#fce7eb]">{{ currentTime() | date:'mediumTime' }}</div>
            <div class="text-sm text-stone-500 dark:text-stone-400">{{ currentTime() | date:'fullDate' }}</div>
          </div>
        </div>
      </div>

      <!-- Main Action Area -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Clock In/Out Widget -->
        <ui-card class="lg:col-span-2 relative overflow-hidden">
          <div class="absolute top-0 right-0 p-32 bg-[#8b1e3f]/5 dark:bg-[#8b1e3f]/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col items-center justify-center py-8 text-center h-full">
            <div class="mb-6">
              <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                [ngClass]="{
                  'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300': attendanceState() === 'not-clocked-in',
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': attendanceState() === 'working',
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': attendanceState() === 'clocked-out'
                }">
                <div class="w-2 h-2 rounded-full"
                  [ngClass]="{
                    'bg-stone-400 dark:bg-stone-500': attendanceState() === 'not-clocked-in',
                    'bg-green-500 animate-pulse': attendanceState() === 'working',
                    'bg-blue-500': attendanceState() === 'clocked-out'
                  }"></div>
                {{ attendanceStateLabel() }}
              </span>
            </div>

            <div class="mb-8">
              @if (attendanceState() === 'working') {
                <div class="text-5xl font-mono font-bold text-stone-800 dark:text-stone-100 mb-2">
                  {{ activeDuration() }}
                </div>
                <p class="text-stone-500 dark:text-stone-400">Duration worked today</p>
              } @else if (attendanceState() === 'clocked-out') {
                <div class="text-5xl font-mono font-bold text-stone-800 dark:text-stone-100 mb-2">
                  {{ formatDuration(todayStatusResource.value()?.workMinutes || 0) }}
                </div>
                <p class="text-stone-500 dark:text-stone-400">Total hours worked today</p>
              } @else {
                <div class="text-5xl font-mono font-bold text-stone-800 dark:text-stone-100 mb-2">--:--:--</div>
                <p class="text-stone-500 dark:text-stone-400">Ready to start your day</p>
              }
            </div>

            <div class="flex gap-4">
              @if (attendanceState() === 'not-clocked-in') {
                <button
                  (click)="handleClockIn()"
                  [disabled]="isActionLoading()"
                  class="h-16 px-8 rounded-full bg-[#8b1e3f] hover:bg-[#722038] text-white text-lg font-semibold shadow-lg shadow-[#8b1e3f]/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3">
                  <ui-icon name="play" class="w-6 h-6"></ui-icon>
                  Clock In
                </button>
              } @else if (attendanceState() === 'working') {
                <button
                  (click)="handleClockOut()"
                  [disabled]="isActionLoading()"
                  class="h-16 px-8 rounded-full bg-red-600 hover:bg-red-700 text-white text-lg font-semibold shadow-lg shadow-red-600/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3">
                  <ui-icon name="stop" class="w-6 h-6"></ui-icon>
                  Clock Out
                </button>
              } @else {
                <div class="text-center p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-700">
                  <p class="text-stone-600 dark:text-stone-300 font-medium">You have completed your work day.</p>
                  <p class="text-xs text-stone-400 dark:text-stone-500 mt-1">See you tomorrow!</p>
                </div>
              }
            </div>
          </div>
        </ui-card>

        <!-- Today's Summary -->
        <div class="space-y-6">
          <ui-card class="h-full">
            <h3 class="font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
              <ui-icon name="calendar" class="w-5 h-5 text-[#8b1e3f] dark:text-[#fce7eb]"></ui-icon>
              Today's Summary
            </h3>

            <div class="space-y-4">
              <div class="flex justify-between items-center py-3 border-b border-stone-100 dark:border-stone-700">
                <span class="text-stone-500 dark:text-stone-400 text-sm">Clock In</span>
                <span class="font-mono font-medium text-stone-800 dark:text-stone-200">
                  {{ (todayStatusResource.value()?.clockIn | date:'shortTime') || '--:--' }}
                </span>
              </div>

              <div class="flex justify-between items-center py-3 border-b border-stone-100 dark:border-stone-700">
                <span class="text-stone-500 dark:text-stone-400 text-sm">Clock Out</span>
                <span class="font-mono font-medium text-stone-800 dark:text-stone-200">
                  {{ (todayStatusResource.value()?.clockOut | date:'shortTime') || 'Working...' }}
                </span>
              </div>

              <div class="flex justify-between items-center py-3 border-b border-stone-100 dark:border-stone-700">
                <span class="text-stone-500 dark:text-stone-400 text-sm">Break Time</span>
                <span class="font-mono font-medium text-stone-800 dark:text-stone-200">
                  {{ todayStatusResource.value()?.breakMinutes || 0 }} min
                </span>
              </div>

              <div class="pt-2">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">Status</span>
                  <ui-badge [variant]="getBadgeVariant(todayStatusResource.value()?.status)">
                    {{ todayStatusResource.value()?.status || 'Pending' }}
                  </ui-badge>
                </div>
              </div>
            </div>
          </ui-card>
        </div>
      </div>

      <!-- Monthly Summary & History -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Monthly Stats -->
        <ui-card class="lg:col-span-1">
          <h3 class="font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <ui-icon name="chart-bar" class="w-5 h-5 text-[#8b1e3f] dark:text-[#fce7eb]"></ui-icon>
            {{ currentMonthName() }} Stats
          </h3>

          <div class="space-y-4">
            <div class="bg-[#fdf2f4] dark:bg-[#8b1e3f]/20 rounded-xl p-4 border border-[#f9d0da] dark:border-[#8b1e3f]/30">
              <p class="text-xs text-[#8b1e3f] dark:text-[#fce7eb] font-semibold uppercase tracking-wider mb-1">Present Days</p>
              <p class="text-2xl font-bold text-[#8b1e3f] dark:text-[#fce7eb]">{{ summaryResource.value()?.presentDays || 0 }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-3 border border-stone-100 dark:border-stone-700">
                <p class="text-xs text-stone-500 dark:text-stone-400 font-semibold mb-1">Late</p>
                <p class="text-lg font-bold text-stone-700 dark:text-stone-200">{{ summaryResource.value()?.lateDays || 0 }}</p>
              </div>
              <div class="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-3 border border-stone-100 dark:border-stone-700">
                <p class="text-xs text-stone-500 dark:text-stone-400 font-semibold mb-1">Absent</p>
                <p class="text-lg font-bold text-stone-700 dark:text-stone-200">{{ summaryResource.value()?.absentDays || 0 }}</p>
              </div>
            </div>

            <div class="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700 shadow-sm">
              <div class="flex justify-between items-center mb-1">
                <p class="text-xs text-stone-500 dark:text-stone-400 font-semibold uppercase">Avg Work Hours</p>
              </div>
              <p class="text-xl font-bold text-stone-800 dark:text-stone-100">
                {{ formatDuration(summaryResource.value()?.avgWorkMinutes || 0) }} / day
              </p>
            </div>
          </div>
        </ui-card>

        <!-- Attendance History Table -->
        <div class="lg:col-span-3">
          <ui-data-table
            [data]="paginatedHistory()"
            [columns]="columns"
            [loading]="historyResource.isLoading()"
            [pageSize]="pageSize"
            [page]="currentPage()"
            [pagination]="true"
            [totalItems]="historyResource.value().length || 0"
            (pageChange)="onPageChange($event)"
            (sortChange)="onSortChange($event)">
          </ui-data-table>
        </div>
      </div>
    </div>
  `
})
export class AttendanceComponent implements OnDestroy {
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);
  private datePipe = inject(DatePipe);
  private authService = inject(AuthService);

  canManage = this.authService.hasRole(['super_admin', 'admin', 'hr_manager', 'manager']);

  // Time state
  currentTime = signal(new Date());
  private timerInterval: any;

  // UI State
  isActionLoading = signal(false);

  // Resources
  todayStatusResource = resource({
    loader: () => this.convex.getClient().query(api.attendance.getTodayStatus, {})
  });

  // Calculate current month range for summary
  currentMonthKey = computed(() => {
    const now = this.currentTime();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Summary data
  summaryData = signal<AttendanceSummary | null>(null);

  // History data
  historyData = signal<any[]>([]);
  historyLoading = signal(false);

  // Wrapper resources that use simple loaders
  summaryResource = {
    value: () => this.summaryData(),
    isLoading: () => false,
    reload: () => this.loadSummary()
  };

  historyResource = {
    value: () => this.historyData(),
    isLoading: () => this.historyLoading(),
    reload: () => this.loadHistory()
  };

  // Derived State
  attendanceState = computed(() => {
    const status = this.todayStatusResource.value();
    if (!status) return 'not-clocked-in';
    if (status.clockOut) return 'clocked-out';
    return 'working';
  });

  attendanceStateLabel = computed(() => {
    switch (this.attendanceState()) {
      case 'not-clocked-in': return 'Not Clocked In';
      case 'working': return 'Currently Working';
      case 'clocked-out': return 'Clocked Out';
      default: return 'Unknown';
    }
  });

  activeDuration = computed(() => {
    // This will update every second because it depends on currentTime signal
    const status = this.todayStatusResource.value();
    if (!status || !status.clockIn || status.clockOut) return '00:00:00';

    const start = new Date(status.clockIn).getTime();
    const now = this.currentTime().getTime();
    const diffMs = Math.max(0, now - start);
    const totalSeconds = Math.floor(diffMs / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });

  currentMonthName = computed(() => {
    return this.datePipe.transform(this.currentTime(), 'MMMM');
  });

  // Pagination & Sorting
  currentPage = signal(1);
  pageSize = 5;
  sortConfig = signal<{key: string, direction: 'asc' | 'desc'} | null>({ key: 'date', direction: 'desc' });

  sortedHistory = computed(() => {
    const data = this.historyResource.value() || [];
    const sort = this.sortConfig();

    // Always copy array before sorting
    const sorted = [...data];

    if (!sort) {
      // Default sort by date desc
      return sorted.sort((a, b) => (a.date < b.date ? 1 : -1));
    }

    return sorted.sort((a, b) => {
      const aVal = a[sort.key] ?? '';
      const bVal = b[sort.key] ?? '';

      if (aVal === bVal) return 0;

      const comparison = aVal > bVal ? 1 : -1;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  });

  paginatedHistory = computed(() => {
    const data = this.sortedHistory();
    const start = (this.currentPage() - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  });

  // Table Configuration
  columns: TableColumn[] = [
    {
      key: 'date',
      header: 'Date',
      type: 'date',
      sortable: true
    },
    {
      key: 'clockIn',
      header: 'Clock In',
      formatter: (val) => val ? this.datePipe.transform(val, 'shortTime') || '-' : '-'
    },
    {
      key: 'clockOut',
      header: 'Clock Out',
      formatter: (val) => val ? this.datePipe.transform(val, 'shortTime') || '-' : '-'
    },
    {
      key: 'workMinutes',
      header: 'Hours',
      formatter: (val) => this.formatDuration(val || 0)
    },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      badgeVariant: (val) => this.getBadgeVariant(val),
      sortable: true
    }
  ];

  constructor() {
    this.timerInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    // Initial data load
    this.loadSummary();
    this.loadHistory();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  async loadSummary() {
    try {
      const month = this.currentMonthKey();
      const result = await this.convex.getClient().query(api.attendance.getAttendanceSummary, { month });
      this.summaryData.set(result);
    } catch (e) {
      console.error('Failed to load summary', e);
    }
  }

  async loadHistory() {
    this.historyLoading.set(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      const result = await this.convex.getClient().query(api.attendance.getMyAttendance, {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      });
      this.historyData.set(result);
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      this.historyLoading.set(false);
    }
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  onSortChange(event: {key: string, direction: 'asc' | 'desc'}) {
    this.sortConfig.set(event);
  }

  async handleClockIn() {
    this.isActionLoading.set(true);
    try {
      await this.convex.getClient().mutation(api.attendance.clockIn, {});
      this.toast.success('Successfully clocked in!');
      this.todayStatusResource.reload();
      this.historyResource.reload();
      this.summaryResource.reload();
    } catch (error: any) {
      this.toast.error(error.message || 'Failed to clock in');
    } finally {
      this.isActionLoading.set(false);
    }
  }

  async handleClockOut() {
    if (!confirm('Are you sure you want to clock out?')) return;

    this.isActionLoading.set(true);
    try {
      await this.convex.getClient().mutation(api.attendance.clockOut, {});
      this.toast.success('Successfully clocked out!');
      this.todayStatusResource.reload();
      this.historyResource.reload();
      this.summaryResource.reload();
    } catch (error: any) {
      this.toast.error(error.message || 'Failed to clock out');
    } finally {
      this.isActionLoading.set(false);
    }
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  getBadgeVariant(status: string | undefined): BadgeVariant {
    switch (status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'danger';
      case 'half-day': return 'warning';
      case 'on-leave': return 'info';
      case 'holiday': return 'neutral';
      default: return 'neutral';
    }
  }
}
