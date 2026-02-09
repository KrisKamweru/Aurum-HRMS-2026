import { Component, computed, effect, inject, OnDestroy, signal, resource } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiBadgeComponent, BadgeVariant } from '../../shared/components/ui-badge/ui-badge.component';
import { UiDataTableComponent, TableColumn } from '../../shared/components/ui-data-table/ui-data-table.component';
import { UiGridComponent } from '../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../shared/components/ui-grid/ui-grid-tile.component';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
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
    UiIconComponent,
    UiButtonComponent,
    UiBadgeComponent,
    UiDataTableComponent,
    UiGridComponent,
    UiGridTileComponent
  ],
  providers: [DatePipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">Time & Attendance</h1>
          <p class="text-stone-500 dark:text-stone-400 mt-1">Track your work hours and attendance history</p>
        </div>

        <div class="flex items-center gap-4">
          @if (canManage()) {
            <ui-button variant="outline" routerLink="team">
              <ui-icon name="users" class="w-4 h-4 mr-2"></ui-icon>
              Team View
            </ui-button>
          }

          <div class="text-right pl-4 border-l border-stone-200 dark:border-white/8">
            <div class="text-3xl font-mono font-bold text-burgundy-700 dark:text-burgundy-400">{{ currentTime() | date:'mediumTime' }}</div>
            <div class="text-sm text-stone-500 dark:text-stone-400">{{ currentTime() | date:'fullDate' }}</div>
          </div>
        </div>
      </div>

      <!-- Main Dash Frame: Clock Widget + Today's Summary -->
      <div class="dash-frame">
        <ui-grid [columns]="'1fr 320px'" [gap]="'0px'">
          <!-- Clock In/Out Widget -->
          <div class="df-clock-widget">
            <div class="df-status-badge">
              <div class="status-dot"
                [ngClass]="{
                  'bg-stone-400 dark:bg-stone-500': attendanceState() === 'not-clocked-in',
                  'bg-amber-400': attendanceState() === 'unlinked',
                  'bg-emerald-400 animate-pulse': attendanceState() === 'working',
                  'bg-blue-400': attendanceState() === 'clocked-out'
                }"></div>
              {{ attendanceStateLabel() }}
            </div>

            <div class="df-clock-display">
              @if (attendanceState() === 'working') {
                <div class="clock-time">{{ activeDuration() }}</div>
                <p class="clock-label">Duration worked today</p>
              } @else if (attendanceState() === 'clocked-out') {
                <div class="clock-time">{{ formatDuration(todayStatusResource.value()?.workMinutes || 0) }}</div>
                <p class="clock-label">Total hours worked today</p>
              } @else if (attendanceState() === 'unlinked') {
                <div class="text-amber-600 dark:text-amber-400 mb-2">
                  <ui-icon name="exclamation-circle" class="w-12 h-12 mx-auto mb-2"></ui-icon>
                </div>
                <p class="clock-label max-w-xs mx-auto">
                  Your account is not linked to an employee profile. Please contact HR to enable time tracking.
                </p>
              } @else {
                <div class="clock-time">--:--:--</div>
                <p class="clock-label">Ready to start your day</p>
              }
            </div>

            <div class="df-clock-actions">
              @if (attendanceState() === 'not-clocked-in') {
                <button
                  (click)="handleClockIn()"
                  [disabled]="isActionLoading()"
                  class="clock-btn clock-btn-in">
                  <ui-icon name="play" class="w-5 h-5"></ui-icon>
                  Clock In
                </button>
              } @else if (attendanceState() === 'working') {
                <button
                  (click)="handleClockOut()"
                  [disabled]="isActionLoading()"
                  class="clock-btn clock-btn-out">
                  <ui-icon name="stop" class="w-5 h-5"></ui-icon>
                  Clock Out
                </button>
              } @else {
                <div class="clock-done">
                  <p class="text-stone-600 dark:text-stone-300 font-medium text-sm">You have completed your work day.</p>
                  <p class="text-xs text-stone-500 dark:text-stone-400 mt-1">See you tomorrow!</p>
                </div>
              }
            </div>
          </div>

          <!-- Today's Summary -->
          <ui-grid-tile title="Today's Summary" [minHeight]="'400px'" [minHeightMobile]="'300px'">
            <div class="df-summary-rows">
              <div class="df-summary-row">
                <span class="summary-label">Clock In</span>
                <span class="summary-value">
                  {{ (todayStatusResource.value()?.clockIn | date:'shortTime') || '--:--' }}
                </span>
              </div>
              <div class="df-summary-row">
                <span class="summary-label">Clock Out</span>
                <span class="summary-value">
                  {{ (todayStatusResource.value()?.clockOut | date:'shortTime') || 'Working...' }}
                </span>
              </div>
              <div class="df-summary-row">
                <span class="summary-label">Break Time</span>
                <span class="summary-value">
                  {{ todayStatusResource.value()?.breakMinutes || 0 }} min
                </span>
              </div>
              <div class="df-summary-row">
                <span class="summary-label">Status</span>
                <ui-badge [variant]="getBadgeVariant(todayStatusResource.value()?.status)">
                  {{ todayStatusResource.value()?.status || 'Pending' }}
                </ui-badge>
              </div>
            </div>
          </ui-grid-tile>
        </ui-grid>
      </div>

      <!-- Monthly Stats + History Table -->
      <div class="dash-frame">
        <ui-grid [columns]="'280px 1fr'" [gap]="'0px'">
          <!-- Monthly Stats Panel -->
          <ui-grid-tile [title]="currentMonthName() + ' Stats'" divider="right">
            <div class="df-stats-content">
              <div class="stat-card stat-highlight">
                <p class="stat-label">Present Days</p>
                <p class="stat-value">{{ summaryResource.value()?.presentDays || 0 }}</p>
              </div>

              <div class="stat-mini-grid">
                <div class="stat-card">
                  <p class="stat-label-sm">Late</p>
                  <p class="stat-value-sm">{{ summaryResource.value()?.lateDays || 0 }}</p>
                </div>
                <div class="stat-card">
                  <p class="stat-label-sm">Absent</p>
                  <p class="stat-value-sm">{{ summaryResource.value()?.absentDays || 0 }}</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="flex justify-between items-center mb-1">
                  <p class="stat-label">Avg Work Hours</p>
                </div>
                <p class="stat-value-lg">
                  {{ formatDuration(summaryResource.value()?.avgWorkMinutes || 0) }} / day
                </p>
              </div>
            </div>
          </ui-grid-tile>

          <!-- History Table -->
          <ui-grid-tile title="Attendance History">
            <span tile-actions class="live-badge">● Live</span>
            <ui-data-table
              cornerStyle="square"
              [data]="paginatedHistory()"
              [columns]="columns"
              [loading]="historyResource.isLoading()"
              [pagination]="historyResource.value().length > pageSize"
              [totalItems]="historyResource.value().length"
              [pageSize]="pageSize"
              [page]="currentPage()"
              [headerVariant]="'plain'"
              [cellTemplates]="{ status: statusTpl }"
              (sortChange)="onSortChange($event)"
              (pageChange)="onPageChange($event)"
            ></ui-data-table>
            <ng-template #statusTpl let-row>
              <span class="df-td-status">
                <span class="dot"
                  [ngClass]="{
                    'bg-emerald-400': row.status === 'present',
                    'bg-amber-400': row.status === 'late',
                    'bg-red-400': row.status === 'absent',
                    'bg-blue-400': row.status === 'half-day',
                    'bg-stone-400': row.status === 'on-leave' || row.status === 'holiday'
                  }"></span>
                {{ row.status }}
              </span>
            </ng-template>
          </ui-grid-tile>
        </ui-grid>
      </div>
    </div>
  `,
  styles: [`
    /* Design Six: Attendance Dash-Frame Styles */
    .dash-frame {
      background: rgba(255,255,255,0.8);
      border: 1px solid #e7e5e4;
      border-radius: 14px;
      overflow: hidden;
    }
    :host-context(.dark) .dash-frame {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(12px);
      border-color: rgba(255,255,255,0.08);
    }

    /* Clock Widget */
    .df-clock-widget {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 1.5rem;
      border-right: 1px solid #e7e5e4;
    }
    :host-context(.dark) .df-clock-widget {
      border-color: rgba(255,255,255,0.08);
    }
    @media (max-width: 900px) {
      .df-clock-widget {
        border-right: none;
        border-bottom: 1px solid #e7e5e4;
      }
      :host-context(.dark) .df-clock-widget {
        border-color: rgba(255,255,255,0.08);
      }
    }

    .df-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.75rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #292524;
      background: #fafaf9;
      border: 1px solid #e7e5e4;
    }
    :host-context(.dark) .df-status-badge {
      background: rgba(255,255,255,0.05);
      border-color: rgba(255,255,255,0.08);
      color: #d6d3d1;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .df-clock-display {
      text-align: center;
    }

    .clock-time {
      font-size: 3rem;
      font-weight: 700;
      font-family: ui-monospace, monospace;
      color: #1c1917;
      margin-bottom: 0.5rem;
    }
    :host-context(.dark) .clock-time {
      color: white;
    }

    .clock-label {
      font-size: 0.75rem;
      color: #78716c;
    }
    :host-context(.dark) .clock-label {
      color: #a8a29e;
    }

    .df-clock-actions {
      display: flex;
      gap: 1rem;
    }

    .clock-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 2rem;
      border-radius: 10px;
      border: none;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .clock-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .clock-btn-in {
      background: #861821;
      color: white;
      box-shadow: 0 4px 12px rgba(134,24,33,0.25);
    }
    .clock-btn-in:not(:disabled):hover {
      background: #741530;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(134,24,33,0.3);
    }

    .clock-btn-out {
      background: #dc2626;
      color: white;
      box-shadow: 0 4px 12px rgba(220,38,38,0.25);
    }
    .clock-btn-out:not(:disabled):hover {
      background: #b91c1c;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(220,38,38,0.3);
    }

    .clock-done {
      text-align: center;
      padding: 1rem 1.5rem;
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      border-radius: 10px;
    }
    :host-context(.dark) .clock-done {
      background: rgba(255,255,255,0.05);
      border-color: rgba(255,255,255,0.08);
    }

    .live-badge {
      font-size: 0.75rem;
      color: #2dd4bf;
      letter-spacing: 0.06em;
    }

    .df-summary-rows {
      display: flex;
      flex-direction: column;
    }

    .df-summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid #fafaf9;
    }
    :host-context(.dark) .df-summary-row {
      border-color: rgba(255,255,255,0.03);
    }
    .df-summary-row:last-child {
      border-bottom: none;
    }

    .summary-label {
      font-size: 0.875rem;
      color: #57534e;
    }
    :host-context(.dark) .summary-label {
      color: #a8a29e;
    }

    .summary-value {
      font-size: 0.875rem;
      font-weight: 600;
      font-family: ui-monospace, monospace;
      color: #1c1917;
    }
    :host-context(.dark) .summary-value {
      color: white;
    }

    .df-stats-content {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .stat-card {
      padding: 0.875rem;
      border-radius: 10px;
      border: 1px solid #e7e5e4;
      background: white;
    }
    :host-context(.dark) .stat-card {
      background: rgba(255,255,255,0.03);
      border-color: rgba(255,255,255,0.08);
    }

    .stat-highlight {
      background: rgba(134,24,33,0.06);
      border-color: rgba(134,24,33,0.15);
    }
    :host-context(.dark) .stat-highlight {
      background: rgba(134,24,33,0.12);
      border-color: rgba(134,24,33,0.2);
    }

    .stat-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #57534e;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }
    :host-context(.dark) .stat-label {
      color: #a8a29e;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #861821;
    }
    :host-context(.dark) .stat-value {
      color: #ff6b77;
    }

    .stat-mini-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .stat-label-sm {
      font-size: 0.75rem;
      font-weight: 500;
      color: #57534e;
      margin-bottom: 0.25rem;
    }
    :host-context(.dark) .stat-label-sm {
      color: #a8a29e;
    }

    .stat-value-sm {
      font-size: 1rem;
      font-weight: 700;
      color: #1c1917;
    }
    :host-context(.dark) .stat-value-sm {
      color: white;
    }

    .stat-value-lg {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1c1917;
    }
    :host-context(.dark) .stat-value-lg {
      color: white;
    }

    .df-td-status {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
    }
  `]
})
export class AttendanceComponent implements OnDestroy {
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);
  private datePipe = inject(DatePipe);
  private authService = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);

  // Expose Math for template usage
  Math = Math;

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

  user = this.authService.getUser();

  // Derived State
  attendanceState = computed(() => {
    if (!this.user()?.employeeId) return 'unlinked';
    const status = this.todayStatusResource.value();
    if (!status) return 'not-clocked-in';
    if (status.clockOut) return 'clocked-out';
    return 'working';
  });

  attendanceStateLabel = computed(() => {
    switch (this.attendanceState()) {
      case 'unlinked': return 'Account Not Linked';
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
    const confirmed = await this.confirmDialog.confirm({
      title: 'Clock Out',
      message: 'Are you sure you want to clock out? This will end your work session for today.',
      confirmText: 'Clock Out',
      cancelText: 'Cancel',
      variant: 'warning'
    });

    if (!confirmed) return;

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

