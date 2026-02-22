import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReportsCsvExportService } from '../data/reports-csv-export.service';
import { ReportsRebuildStore } from '../data/reports-rebuild.store';
import { TableColumn, UiDataTableComponent } from '../../../shared/components/ui-data-table/ui-data-table.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiDateRangeComponent } from '../../../shared/components/ui-date-range/ui-date-range.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reports-attendance-rebuild',
  imports: [RouterLink, UiButtonComponent, UiDateRangeComponent, UiDataTableComponent, UiIconComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <a routerLink="/reports" class="text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
              <ui-icon name="arrow-left" class="h-4 w-4"></ui-icon>
            </a>
            <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Attendance Report</h1>
          </div>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Review attendance status, clock events, and worked time across a selected period.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <ui-button variant="secondary" size="sm" [disabled]="attendanceLoading()" (onClick)="applyFilters()">Refresh</ui-button>
          <ui-button variant="outline" size="sm" [disabled]="attendanceRecords().length === 0" (onClick)="exportCsv()">
            Export CSV
          </ui-button>
        </div>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          {{ error() }}
        </section>
      }

      <section class="mb-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
          <div>
            <p class="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">Date Range</p>
            <ui-date-range [startDate]="startDate()" [endDate]="endDate()" (rangeChange)="onDateRangeChange($event)" />
          </div>
          <div>
            <label for="attendance-department" class="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Department
            </label>
            <select
              id="attendance-department"
              class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/[0.03] dark:text-white"
              [value]="selectedDepartmentId()"
              (change)="setDepartment($event)"
            >
              <option value="">All Departments</option>
              @for (department of departments(); track department.id) {
                <option [value]="department.id">{{ department.name }}</option>
              }
            </select>
          </div>
          <div class="flex justify-start lg:justify-end">
            <ui-button variant="primary" size="sm" [disabled]="attendanceLoading()" (onClick)="applyFilters()">Generate</ui-button>
          </div>
        </div>
      </section>

      <section class="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Total Records</p>
          <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ attendanceSummary().totalRecords }}</p>
        </article>
        <article class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700/30 dark:bg-emerald-900/15">
          <p class="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Present</p>
          <p class="mt-1 text-2xl font-semibold text-emerald-800 dark:text-emerald-200">{{ attendanceSummary().present }}</p>
        </article>
        <article class="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700/30 dark:bg-amber-900/15">
          <p class="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">Late</p>
          <p class="mt-1 text-2xl font-semibold text-amber-800 dark:text-amber-200">{{ attendanceSummary().late }}</p>
        </article>
        <article class="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-700/30 dark:bg-red-900/15">
          <p class="text-xs uppercase tracking-wide text-red-700 dark:text-red-300">Absent</p>
          <p class="mt-1 text-2xl font-semibold text-red-800 dark:text-red-200">{{ attendanceSummary().absent }}</p>
        </article>
      </section>

      <ui-data-table [data]="attendanceRecords()" [columns]="columns" [loading]="attendanceLoading()" headerVariant="neutral" />
    </main>
  `
})
export class ReportsAttendanceRebuildComponent implements OnInit {
  private readonly store = inject(ReportsRebuildStore);
  private readonly csvExport = inject(ReportsCsvExportService);

  readonly departments = this.store.departments;
  readonly attendanceRecords = this.store.attendanceRecords;
  readonly attendanceSummary = this.store.attendanceSummary;
  readonly attendanceLoading = this.store.attendanceLoading;
  readonly error = this.store.error;

  readonly startDate = signal<Date | null>(null);
  readonly endDate = signal<Date | null>(null);
  readonly selectedDepartmentId = signal('');

  readonly columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'date', header: 'Date', sortable: true, type: 'date' },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      badgeVariant: (value) => this.statusVariant(value)
    },
    {
      key: 'clockIn',
      header: 'Clock In',
      formatter: (value) => this.formatClock(value)
    },
    {
      key: 'clockOut',
      header: 'Clock Out',
      formatter: (value) => this.formatClock(value)
    },
    {
      key: 'workMinutes',
      header: 'Worked',
      formatter: (value) => this.formatDuration(value)
    }
  ];

  ngOnInit(): void {
    this.seedDefaultRange();
    void this.store.loadFilterOptions();
    void this.applyFilters();
  }

  onDateRangeChange(range: { start: Date; end: Date }): void {
    this.startDate.set(range.start);
    this.endDate.set(range.end);
  }

  setDepartment(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    this.selectedDepartmentId.set(target.value);
  }

  async applyFilters(): Promise<void> {
    const startDate = this.startDate();
    const endDate = this.endDate();
    if (!startDate || !endDate) {
      return;
    }
    await this.store.loadAttendance({
      startDate: this.toIsoDate(startDate),
      endDate: this.toIsoDate(endDate),
      departmentId: this.selectedDepartmentId().trim() || undefined
    });
  }

  exportCsv(): void {
    const rows = this.attendanceRecords().map((record) => ({
      employeeName: record.employeeName,
      employeeNumber: record.employeeNumber,
      department: record.department,
      date: record.date,
      status: record.status,
      clockIn: record.clockIn ?? '',
      clockOut: record.clockOut ?? '',
      workMinutes: record.workMinutes,
      notes: record.notes
    }));
    this.csvExport.exportRows(this.buildFilename(), rows, [
      { key: 'employeeName', header: 'Employee Name' },
      { key: 'employeeNumber', header: 'Employee Number' },
      { key: 'department', header: 'Department' },
      { key: 'date', header: 'Date' },
      { key: 'status', header: 'Status' },
      { key: 'clockIn', header: 'Clock In', formatter: (value) => this.formatClock(value) },
      { key: 'clockOut', header: 'Clock Out', formatter: (value) => this.formatClock(value) },
      { key: 'workMinutes', header: 'Worked Minutes', formatter: (value) => this.formatDuration(value) },
      { key: 'notes', header: 'Notes' }
    ]);
  }

  private seedDefaultRange(): void {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    this.startDate.set(first);
    this.endDate.set(now);
  }

  private toIsoDate(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private buildFilename(): string {
    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end) {
      return 'attendance-report';
    }
    return `attendance-report-${this.toIsoDate(start)}-to-${this.toIsoDate(end)}`;
  }

  private formatClock(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  private formatDuration(value: unknown): string {
    const minutes = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    if (!minutes) {
      return '0m';
    }
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${hours}h ${remainder}m`;
  }

  private statusVariant(value: unknown): BadgeVariant {
    if (value === 'present') {
      return 'success';
    }
    if (value === 'late') {
      return 'warning';
    }
    if (value === 'absent') {
      return 'danger';
    }
    if (value === 'on-leave' || value === 'half-day') {
      return 'info';
    }
    return 'neutral';
  }
}
