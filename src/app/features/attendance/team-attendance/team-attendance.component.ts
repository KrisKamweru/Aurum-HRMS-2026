import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiDataTableComponent, TableColumn } from '../../../shared/components/ui-data-table/ui-data-table.component';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { ManualEntryModalComponent } from './manual-entry-modal/manual-entry-modal.component';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { api } from '../../../../../convex/_generated/api';

@Component({
  selector: 'app-team-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiCardComponent,
    UiIconComponent,
    UiButtonComponent,
    UiDataTableComponent,
    ManualEntryModalComponent
  ],
  providers: [DatePipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-stone-800 dark:text-stone-100">Team Attendance</h1>
          <p class="text-stone-500 dark:text-stone-400 mt-1">Monitor and manage your team's work hours</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <input
              type="date"
              [ngModel]="selectedDate()"
              (ngModelChange)="onDateChange($event)"
              class="pl-10 pr-4 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#8b1e3f] focus:border-transparent transition-all"
            />
            <ui-icon name="calendar" class="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></ui-icon>
          </div>
          <ui-button variant="outline" (onClick)="refresh()">
            <ui-icon name="arrow-path" class="w-4 h-4"></ui-icon>
          </ui-button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ui-icon name="check" class="w-6 h-6"></ui-icon>
          </div>
          <div>
            <div class="text-2xl font-bold text-stone-800 dark:text-stone-100">{{ stats().present }}</div>
            <div class="text-xs text-stone-500 dark:text-stone-400 font-medium uppercase">Present</div>
          </div>
        </div>

        <div class="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ui-icon name="clock" class="w-6 h-6"></ui-icon>
          </div>
          <div>
            <div class="text-2xl font-bold text-stone-800 dark:text-stone-100">{{ stats().late }}</div>
            <div class="text-xs text-stone-500 dark:text-stone-400 font-medium uppercase">Late</div>
          </div>
        </div>

        <div class="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
            <ui-icon name="x-mark" class="w-6 h-6"></ui-icon>
          </div>
          <div>
            <div class="text-2xl font-bold text-stone-800 dark:text-stone-100">{{ stats().absent }}</div>
            <div class="text-xs text-stone-500 dark:text-stone-400 font-medium uppercase">Absent</div>
          </div>
        </div>

        <div class="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ui-icon name="briefcase" class="w-6 h-6"></ui-icon>
          </div>
          <div>
            <div class="text-2xl font-bold text-stone-800 dark:text-stone-100">{{ stats().onLeave }}</div>
            <div class="text-xs text-stone-500 dark:text-stone-400 font-medium uppercase">On Leave</div>
          </div>
        </div>
      </div>

      <!-- Team Table -->
      <ui-card class="overflow-hidden">
        <ui-data-table
          [data]="tableData()"
          [columns]="columns"
          [loading]="isLoading()"
          [pagination]="true"
          [pageSize]="10"
          [page]="currentPage()"
          [totalItems]="tableData().length"
          (pageChange)="currentPage.set($event)"
          [actionsTemplate]="actionTemplate"
        >
          <!-- Custom Action Template -->
          <ng-template #actionTemplate let-row>
            <ui-button variant="ghost" size="sm" (onClick)="openEditModal(row)">
              <ui-icon name="pencil-square" class="w-4 h-4 text-stone-500"></ui-icon>
            </ui-button>
          </ng-template>
        </ui-data-table>
      </ui-card>
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

  selectedDate = signal(new Date().toISOString().split('T')[0]);
  currentPage = signal(1);

  // Modal State
  isModalOpen = signal(false);
  selectedEmployee = signal<{ id: string, name: string } | null>(null);
  selectedRecord = signal<any>(null);

  // Data State
  teamData = signal<any[]>([]);
  isLoading = signal(false);

  constructor() {
    effect(() => {
      const date = this.selectedDate();
      this.loadData(date);
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
      sortable: true,
      formatter: (val: any, row: any) => {
        return `<div class="font-medium text-stone-800 dark:text-stone-100">${val}</div>
                <div class="text-xs text-stone-500">${row.email}</div>`;
      }
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
}
