import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { UiDataTableComponent, TableColumn } from '../../../shared/components/ui-data-table/ui-data-table.component';
import { BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { ReportFiltersComponent, ReportFilters } from '../components/report-filters.component';
import { UiGridComponent } from '../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../shared/components/ui-grid/ui-grid-tile.component';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { CsvExportService } from '../../../core/services/csv-export.service';
import { ToastService } from '../../../shared/services/toast.service';
import { api } from '../../../../../convex/_generated/api';

interface AttendanceRecord {
  _id: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  date: string;
  status: string;
  clockIn: string | null;
  clockOut: string | null;
  workMinutes: number;
  notes: string;
}

interface AttendanceSummary {
  totalRecords: number;
  present: number;
  late: number;
  absent: number;
  'half-day': number;
  'on-leave': number;
  holiday: number;
}

@Component({
  selector: 'app-attendance-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UiButtonComponent,
    UiIconComponent,
    UiDataTableComponent,
    ReportFiltersComponent,
    UiGridComponent,
    UiGridTileComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <a routerLink="/reports" class="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              <ui-icon name="arrow-left" class="w-5 h-5"></ui-icon>
            </a>
            <h1 class="text-2xl font-bold text-stone-900 dark:text-stone-100">Attendance Report</h1>
          </div>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400 ml-8">
            Track employee attendance and work hours
          </p>
        </div>

        <ui-button
          variant="outline"
          (onClick)="exportToCsv()"
          [loading]="exporting()"
          [disabled]="loading()"
        >
          <ui-icon name="arrow-down-tray" class="w-4 h-4 mr-2"></ui-icon>
          Export CSV
        </ui-button>
      </div>

      <div class="dash-frame">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="Filters" variant="compact" divider="bottom">
            <div class="tile-body">
              <app-report-filters
                [showDateRange]="true"
                [showDepartment]="true"
                (filtersChange)="onFiltersChange($event)"
              ></app-report-filters>
            </div>
          </ui-grid-tile>

          @if (summary()) {
            <ui-grid-tile title="Summary" variant="compact" divider="bottom">
              <div class="tile-body">
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div class="bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
                    <p class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Total Records</p>
                    <p class="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100">{{ summary()!.totalRecords }}</p>
                  </div>
                  <div class="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700/30 p-4">
                    <p class="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Present</p>
                    <p class="mt-1 text-2xl font-bold text-green-700 dark:text-green-300">{{ summary()!.present }}</p>
                  </div>
                  <div class="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/30 p-4">
                    <p class="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Late</p>
                    <p class="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">{{ summary()!.late }}</p>
                  </div>
                  <div class="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700/30 p-4">
                    <p class="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">Absent</p>
                    <p class="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">{{ summary()!.absent }}</p>
                  </div>
                  <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700/30 p-4">
                    <p class="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">On Leave</p>
                    <p class="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">{{ summary()!['on-leave'] }}</p>
                  </div>
                  <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700/30 p-4">
                    <p class="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Half Day</p>
                    <p class="mt-1 text-2xl font-bold text-purple-700 dark:text-purple-300">{{ summary()!['half-day'] }}</p>
                  </div>
                </div>
              </div>
            </ui-grid-tile>
          }

          <ui-grid-tile title="Attendance Records" variant="compact">
            @if (records().length > 0) {
              <span tile-actions class="text-sm text-stone-500 dark:text-stone-400">{{ records().length }} records</span>
            }
            <ui-data-table
              [data]="records()"
              [columns]="columns"
              [loading]="loading()"
              [headerVariant]="'neutral'"
            ></ui-data-table>

            @if (!loading() && records().length === 0 && hasAppliedFilters()) {
              <div class="tile-body text-center">
                <ui-icon name="clipboard-document-list" class="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4"></ui-icon>
                <p class="text-stone-600 dark:text-stone-400">No attendance records found for the selected filters</p>
              </div>
            }
          </ui-grid-tile>
        </ui-grid>
      </div>
    </div>
  `
})
export class AttendanceReportComponent implements OnDestroy {
  private convexService = inject(ConvexClientService);
  private csvExportService = inject(CsvExportService);
  private toastService = inject(ToastService);

  records = signal<AttendanceRecord[]>([]);
  summary = signal<AttendanceSummary | null>(null);
  loading = signal(false);
  exporting = signal(false);

  private currentFilters: ReportFilters | null = null;
  private unsubscribe?: () => void;

  columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'date', header: 'Date', type: 'date', sortable: true },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      badgeVariant: (value: string): BadgeVariant => {
        const variants: Record<string, BadgeVariant> = {
          present: 'success',
          late: 'warning',
          absent: 'danger',
          'half-day': 'info',
          'on-leave': 'info',
          holiday: 'neutral',
        };
        return variants[value] || 'neutral';
      }
    },
    {
      key: 'clockIn',
      header: 'Clock In',
      formatter: (value: string | null) => value ? this.formatTime(value) : '-'
    },
    {
      key: 'clockOut',
      header: 'Clock Out',
      formatter: (value: string | null) => value ? this.formatTime(value) : '-'
    },
    {
      key: 'workMinutes',
      header: 'Duration',
      formatter: (value: number) => this.formatDuration(value)
    },
  ];

  hasAppliedFilters(): boolean {
    return this.currentFilters !== null;
  }

  onFiltersChange(filters: ReportFilters) {
    this.currentFilters = filters;
    this.loadReport(filters);
  }

  private loadReport(filters: ReportFilters) {
    if (!filters.dateRange) return;

    this.loading.set(true);
    this.unsubscribe?.();

    const client = this.convexService.getClient();

    this.unsubscribe = client.onUpdate(
      api.reports.getAttendanceReport,
      {
        startDate: filters.dateRange.startDate,
        endDate: filters.dateRange.endDate,
        departmentId: filters.departmentId || undefined,
      },
      (data) => {
        this.records.set(data.records as AttendanceRecord[]);
        this.summary.set(data.summary as AttendanceSummary);
        this.loading.set(false);
      }
    );
  }

  exportToCsv() {
    if (this.records().length === 0) {
      this.toastService.warning('No attendance data to export for the selected filters');
      return;
    }

    this.exporting.set(true);
    try {
      const csvColumns = [
        { key: 'employeeName', header: 'Employee Name' },
        { key: 'employeeNumber', header: 'Employee #' },
        { key: 'department', header: 'Department' },
        { key: 'date', header: 'Date' },
        { key: 'status', header: 'Status' },
        {
          key: 'clockIn',
          header: 'Clock In',
          formatter: (value: unknown) => value ? this.formatTime(value as string) : ''
        },
        {
          key: 'clockOut',
          header: 'Clock Out',
          formatter: (value: unknown) => value ? this.formatTime(value as string) : ''
        },
        {
          key: 'workMinutes',
          header: 'Duration (HH:MM)',
          formatter: (value: unknown) => this.csvExportService.formatDuration(value)
        },
        { key: 'notes', header: 'Notes' },
      ];

      const filename = `attendance-report-${this.currentFilters?.dateRange?.startDate}-to-${this.currentFilters?.dateRange?.endDate}`;
      this.csvExportService.exportToCsv(this.records() as unknown as Record<string, unknown>[], csvColumns, filename);
      this.toastService.success('Attendance report exported successfully');
    } catch (error: any) {
      this.toastService.error(error.message || 'Attendance export failed');
    } finally {
      this.exporting.set(false);
    }
  }

  private formatTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  }

  private formatDuration(minutes: number): string {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  ngOnDestroy() {
    this.unsubscribe?.();
  }
}
