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
  template: ''
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
