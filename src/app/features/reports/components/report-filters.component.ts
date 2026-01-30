import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface ReportFilters {
  dateRange?: DateRangeFilter;
  departmentId?: Id<'departments'> | null;
  payrollRunId?: Id<'payroll_runs'> | null;
}

interface Department {
  _id: Id<'departments'>;
  name: string;
  code: string;
}

interface PayrollRun {
  _id: Id<'payroll_runs'>;
  month: number;
  year: number;
  label: string;
  employeeCount: number;
  totalNetPay: number;
}

@Component({
  selector: 'app-report-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent, UiIconComponent],
  template: `
    <div class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4 sm:p-6">
      <div class="flex flex-wrap items-end gap-4">
        <!-- Date Range Filters -->
        @if (showDateRange) {
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              [(ngModel)]="startDate"
              class="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-burgundy-500 focus:border-burgundy-500 transition-colors"
            />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              End Date
            </label>
            <input
              type="date"
              [(ngModel)]="endDate"
              class="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-burgundy-500 focus:border-burgundy-500 transition-colors"
            />
          </div>
        }

        <!-- Payroll Run Selector -->
        @if (showPayrollRun) {
          <div class="flex-1 min-w-[250px]">
            <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Payroll Period
            </label>
            <select
              [(ngModel)]="selectedPayrollRunId"
              class="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-burgundy-500 focus:border-burgundy-500 transition-colors"
            >
              <option [ngValue]="null">Select a payroll run...</option>
              @for (run of payrollRuns(); track run._id) {
                <option [ngValue]="run._id">{{ run.label }} ({{ run.employeeCount }} employees)</option>
              }
            </select>
          </div>
        }

        <!-- Department Filter -->
        @if (showDepartment) {
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Department
            </label>
            <select
              [(ngModel)]="selectedDepartmentId"
              class="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-burgundy-500 focus:border-burgundy-500 transition-colors"
            >
              <option [ngValue]="null">All Departments</option>
              @for (dept of departments(); track dept._id) {
                <option [ngValue]="dept._id">{{ dept.name }}</option>
              }
            </select>
          </div>
        }

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <ui-button
            variant="primary"
            (onClick)="applyFilters()"
            [disabled]="!isValid()"
          >
            <ui-icon name="magnifying-glass" class="w-4 h-4 mr-2"></ui-icon>
            Generate
          </ui-button>
          <ui-button
            variant="outline"
            (onClick)="resetFilters()"
          >
            <ui-icon name="arrow-path" class="w-4 h-4 mr-2"></ui-icon>
            Reset
          </ui-button>
        </div>
      </div>
    </div>
  `
})
export class ReportFiltersComponent implements OnInit {
  private convexService = inject(ConvexClientService);

  @Input() showDateRange = false;
  @Input() showDepartment = false;
  @Input() showPayrollRun = false;

  @Output() filtersChange = new EventEmitter<ReportFilters>();

  // Filter values
  startDate = '';
  endDate = '';
  selectedDepartmentId: Id<'departments'> | null = null;
  selectedPayrollRunId: Id<'payroll_runs'> | null = null;

  // Data for dropdowns
  departments = signal<Department[]>([]);
  payrollRuns = signal<PayrollRun[]>([]);

  private unsubscribeDepts?: () => void;
  private unsubscribeRuns?: () => void;

  ngOnInit() {
    this.setDefaultDates();
    this.loadFilterData();
  }

  private setDefaultDates() {
    // Default to current month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

    this.startDate = `${year}-${month}-01`;
    this.endDate = `${year}-${month}-${lastDay}`;
  }

  private loadFilterData() {
    const client = this.convexService.getClient();

    // Load departments
    if (this.showDepartment) {
      this.unsubscribeDepts = client.onUpdate(
        api.reports.getDepartments,
        {},
        (data) => {
          this.departments.set(data as Department[]);
        }
      );
    }

    // Load payroll runs
    if (this.showPayrollRun) {
      this.unsubscribeRuns = client.onUpdate(
        api.reports.getPayrollRuns,
        {},
        (data) => {
          this.payrollRuns.set(data as PayrollRun[]);
          // Auto-select the most recent run if available
          if (data.length > 0 && !this.selectedPayrollRunId) {
            this.selectedPayrollRunId = data[0]._id;
          }
        }
      );
    }
  }

  isValid(): boolean {
    if (this.showDateRange) {
      if (!this.startDate || !this.endDate) return false;
      if (this.startDate > this.endDate) return false;
    }
    if (this.showPayrollRun && !this.selectedPayrollRunId) {
      return false;
    }
    return true;
  }

  applyFilters() {
    if (!this.isValid()) return;

    const filters: ReportFilters = {};

    if (this.showDateRange) {
      filters.dateRange = {
        startDate: this.startDate,
        endDate: this.endDate,
      };
    }

    if (this.showDepartment) {
      filters.departmentId = this.selectedDepartmentId;
    }

    if (this.showPayrollRun) {
      filters.payrollRunId = this.selectedPayrollRunId;
    }

    this.filtersChange.emit(filters);
  }

  resetFilters() {
    this.setDefaultDates();
    this.selectedDepartmentId = null;
    if (this.payrollRuns().length > 0) {
      this.selectedPayrollRunId = this.payrollRuns()[0]._id;
    } else {
      this.selectedPayrollRunId = null;
    }
  }

  ngOnDestroy() {
    this.unsubscribeDepts?.();
    this.unsubscribeRuns?.();
  }
}
