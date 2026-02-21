import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiDataTableComponent, TableColumn } from '../../../shared/components/ui-data-table/ui-data-table.component';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { ManualEntryModalComponent } from './manual-entry-modal/manual-entry-modal.component';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { api } from '../../../../../convex/_generated/api';
import { UiGridComponent } from '../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../shared/components/ui-grid/ui-grid-tile.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-team-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiIconComponent,
    UiButtonComponent,
    UiDataTableComponent,
    UiGridComponent,
    UiGridTileComponent,
    ManualEntryModalComponent
  ],
  providers: [DatePipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">Team Attendance</h1>
          <p class="text-stone-500 dark:text-stone-400 mt-1">Monitor and manage your team's work hours</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <input
              type="date"
              [ngModel]="selectedDate()"
              (ngModelChange)="onDateChange($event)"
              class="pl-10 pr-4 py-2 rounded-lg border border-stone-200 dark:border-white/8 bg-white dark:bg-white/5 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-burgundy-700 focus:border-transparent transition-all"
            />
            <ui-icon name="calendar" class="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></ui-icon>
          </div>
          <ui-button variant="outline" (onClick)="refresh()">
            <ui-icon name="arrow-path" class="w-4 h-4"></ui-icon>
          </ui-button>
        </div>
      </div>

      <div class="dash-frame">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="Attendance Snapshot" variant="compact" divider="bottom">
            <div class="tile-body">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                <div class="bg-white dark:bg-white/5 rounded-xl p-4 border border-stone-200 dark:border-white/8 shadow-sm flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ui-icon name="check" class="w-6 h-6"></ui-icon>
                  </div>
                  <div>
                    <div class="text-2xl font-bold text-stone-800 dark:text-stone-100">{{ stats().present }}</div>
                    <div class="text-xs text-stone-500 dark:text-stone-400 font-medium uppercase">Present</div>
                  </div>
                </div>

                <div class="bg-white dark:bg-white/5 rounded-xl p-4 border border-stone-200 dark:border-white/8 shadow-sm flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <ui-icon name="clock" class="w-6 h-6"></ui-icon>
                  </div>
                  <div>
                    <div class="text-2xl font-bold text-stone-800 dark:text-stone-100">{{ stats().late }}</div>
                    <div class="text-xs text-stone-500 dark:text-stone-400 font-medium uppercase">Late</div>
                  </div>
                </div>

                <div class="bg-white dark:bg-white/5 rounded-xl p-4 border border-stone-200 dark:border-white/8 shadow-sm flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <ui-icon name="x-mark" class="w-6 h-6"></ui-icon>
                  </div>
                  <div>
                    <div class="text-2xl font-bold text-stone-800 dark:text-stone-100">{{ stats().absent }}</div>
                    <div class="text-xs text-stone-500 dark:text-stone-400 font-medium uppercase">Absent</div>
                  </div>
                </div>

                <div class="bg-white dark:bg-white/5 rounded-xl p-4 border border-stone-200 dark:border-white/8 shadow-sm flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <ui-icon name="briefcase" class="w-6 h-6"></ui-icon>
                  </div>
                  <div>
                    <div class="text-2xl font-bold text-stone-800 dark:text-stone-100">{{ stats().onLeave }}</div>
                    <div class="text-xs text-stone-500 dark:text-stone-400 font-medium uppercase">On Leave</div>
                  </div>
                </div>
              </div>
            </div>
          </ui-grid-tile>

          @if (heldLoading() || heldEvents().length > 0) {
            <ui-grid-tile title="Held Punches Requiring Review" variant="compact" divider="bottom">
              <div class="tile-body">
                @if (heldLoading()) {
                  <p class="text-sm text-stone-500 dark:text-stone-400">Loading held punches...</p>
                } @else {
                  <div class="space-y-3">
                    @for (held of heldEvents(); track held._id) {
                      <div class="rounded-lg border border-amber-200 dark:border-amber-700/40 bg-amber-50/70 dark:bg-amber-900/10 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p class="text-sm font-semibold text-stone-800 dark:text-stone-100">{{ held.employeeName }}</p>
                          <p class="text-xs text-stone-600 dark:text-stone-400">{{ held.eventType }} • Risk {{ held.riskLevel }} ({{ held.riskScore }})</p>
                          <p class="text-xs text-stone-500 dark:text-stone-400">{{ held.capturedAt | date:'medium' }}</p>
                        </div>
                        <div class="flex items-center gap-2">
                          <ui-button size="sm" variant="outline" (onClick)="reviewHeldEvent(held._id, 'rejected')">Reject</ui-button>
                          <ui-button size="sm" variant="primary" (onClick)="reviewHeldEvent(held._id, 'approved')">Approve</ui-button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </ui-grid-tile>
          }

          <ui-grid-tile title="Team Attendance" variant="compact">
            <div class="tile-body">
              <ui-data-table
                cornerStyle="square"
                [data]="tableData()"
                [columns]="columns"
                [loading]="isLoading()"
                [pagination]="true"
                [pageSize]="10"
                [page]="currentPage()"
                [totalItems]="tableData().length"
                (pageChange)="currentPage.set($event)"
                [actionsTemplate]="actionTemplate"
                [cellTemplates]="{ 'name': employeeTemplate }"
                headerVariant="plain"
              >
                <!-- Employee Column Template -->
                <ng-template #employeeTemplate let-row>
                  <div>
                    <div class="font-medium text-stone-800 dark:text-stone-100">{{ row.name }}</div>
                    <div class="text-xs text-stone-500">{{ row.email }}</div>
                  </div>
                </ng-template>

                <!-- Custom Action Template -->
                <ng-template #actionTemplate let-row>
                  <ui-button variant="ghost" size="sm" (onClick)="openEditModal(row)">
                    <ui-icon name="pencil-square" class="w-4 h-4 text-stone-500"></ui-icon>
                  </ui-button>
                </ng-template>
              </ui-data-table>
            </div>
          </ui-grid-tile>
        </ui-grid>
      </div>
    </div>

    <!-- Edit Modal -->
    <app-manual-entry-modal
      [isOpen]="isModalOpen()"
      [employee]="selectedEmployee()"
      [date]="selectedDate()"
      [record]="selectedRecord()"
      (close)="isModalOpen.set(false)"
      (saved)="refresh()"
    ></app-manual-entry-modal>
  `
})
export class TeamAttendanceComponent {
  private convex = inject(ConvexClientService);
  private datePipe = inject(DatePipe);
  private toast = inject(ToastService);

  selectedDate = signal(new Date().toISOString().split('T')[0]);
  currentPage = signal(1);

  // Modal State
  isModalOpen = signal(false);
  selectedEmployee = signal<{ id: string, name: string } | null>(null);
  selectedRecord = signal<any>(null);

  // Data State
  teamData = signal<any[]>([]);
  isLoading = signal(false);
  heldEvents = signal<any[]>([]);
  heldLoading = signal(false);

  constructor() {
    effect(() => {
      const date = this.selectedDate();
      this.loadData(date);
      this.loadHeldEvents();
    });
  }

  async loadData(date: string) {
    this.isLoading.set(true);
    try {
      const result = await this.convex.getClient().query(api.attendance.getTeamAttendance, { date });
      this.teamData.set(result || []);
    } catch (error) {
      console.error('Failed to load team attendance:', error);
      this.teamData.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Derived State
  tableData = computed(() => {
    const rawData = this.teamData() || [];
    return rawData.map((item: any) => ({
      id: item.employee.id,
      name: item.employee.name,
      email: item.employee.email,
      departmentId: item.employee.departmentId,
      designationId: item.employee.designationId,
      clockIn: item.attendance?.clockIn,
      clockOut: item.attendance?.clockOut,
      workMinutes: item.attendance?.workMinutes,
      status: item.attendance?.status || (this.isToday(this.selectedDate()) ? 'pending' : 'absent'),
      originalRecord: item.attendance
    }));
  });

  stats = computed(() => {
    const data = this.tableData();
    return {
      present: data.filter((d: any) => d.status === 'present' || d.status === 'half-day').length,
      late: data.filter((d: any) => d.status === 'late').length,
      absent: data.filter((d: any) => d.status === 'absent').length,
      onLeave: data.filter((d: any) => d.status === 'on-leave').length
    };
  });

  columns: TableColumn[] = [
    {
      key: 'name',
      header: 'Employee',
      sortable: true
    },
    {
      key: 'clockIn',
      header: 'In',
      formatter: (val: any) => val ? this.datePipe.transform(val, 'shortTime') || '-' : '-'
    },
    {
      key: 'clockOut',
      header: 'Out',
      formatter: (val: any) => val ? this.datePipe.transform(val, 'shortTime') || '-' : '-'
    },
    {
      key: 'workMinutes',
      header: 'Hrs',
      formatter: (val: any) => this.formatDuration(val)
    },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      badgeVariant: (val: any) => this.getBadgeVariant(val),
      sortable: true
    }
  ];

  onDateChange(date: string) {
    this.selectedDate.set(date);
  }

  refresh() {
    this.loadData(this.selectedDate());
    this.loadHeldEvents();
  }

  openEditModal(row: any) {
    this.selectedEmployee.set({ id: row.id, name: row.name });
    this.selectedRecord.set(row.originalRecord);
    this.isModalOpen.set(true);
  }

  isToday(dateStr: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  }

  formatDuration(minutes: number | undefined): string {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  getBadgeVariant(status: string): BadgeVariant {
    switch (status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'half-day': return 'warning';
      case 'absent': return 'danger';
      case 'on-leave': return 'info';
      case 'holiday': return 'neutral';
      case 'pending': return 'neutral';
      default: return 'neutral';
    }
  }

  async loadHeldEvents() {
    this.heldLoading.set(true);
    try {
      const held = await this.convex.getClient().query(api.attendance.listHeldTrustEvents, { limit: 25 });
      this.heldEvents.set(held || []);
    } catch (error) {
      console.error('Failed to load held trust events:', error);
      this.heldEvents.set([]);
    } finally {
      this.heldLoading.set(false);
    }
  }

  async reviewHeldEvent(eventId: string, decision: 'approved' | 'rejected') {
    try {
      await this.convex.getClient().mutation(api.attendance.reviewHeldTrustEvent, {
        eventId: eventId as any,
        decision,
      });
      this.toast.success(decision === 'approved' ? 'Punch approved' : 'Punch rejected');
      this.refresh();
    } catch (error: any) {
      this.toast.error(error?.message || 'Failed to review held punch');
    }
  }
}

