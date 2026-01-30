import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { REPORT_DEFINITIONS, ReportDefinition } from './models/report-definitions';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterLink, UiIconComponent],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold text-stone-900 dark:text-stone-100">Reports</h1>
        <p class="mt-2 text-stone-600 dark:text-stone-400">
          Generate and export reports for attendance, payroll, and tax data
        </p>
      </div>

      <!-- Report Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (report of reports; track report.id) {
          <a
            [routerLink]="report.route"
            class="group block"
          >
            <div class="h-full bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 hover:border-burgundy-300 dark:hover:border-burgundy-700 hover:shadow-lg hover:shadow-burgundy-100/50 dark:hover:shadow-burgundy-900/20 transition-all duration-200">
              <!-- Icon -->
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-burgundy-100 to-burgundy-50 dark:from-burgundy-900/50 dark:to-burgundy-950/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <ui-icon [name]="report.icon" class="w-6 h-6 text-burgundy-700 dark:text-burgundy-300"></ui-icon>
              </div>

              <!-- Content -->
              <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2 group-hover:text-burgundy-800 dark:group-hover:text-burgundy-300 transition-colors">
                {{ report.name }}
              </h3>
              <p class="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                {{ report.description }}
              </p>

              <!-- Category Badge -->
              <div class="mt-4 flex items-center gap-2">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  [ngClass]="getCategoryClasses(report.category)"
                >
                  {{ getCategoryLabel(report.category) }}
                </span>
                <span class="text-xs text-stone-400 dark:text-stone-500">
                  CSV Export
                </span>
              </div>

              <!-- Arrow indicator -->
              <div class="mt-4 flex items-center text-burgundy-700 dark:text-burgundy-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-sm font-medium">View Report</span>
                <ui-icon name="arrow-right" class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"></ui-icon>
              </div>
            </div>
          </a>
        }
      </div>

      <!-- Future Reports Section -->
      <div class="mt-12">
        <h2 class="text-lg font-semibold text-stone-700 dark:text-stone-300 mb-4">Coming Soon</h2>
        <div class="bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-6">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
              <ui-icon name="sparkles" class="w-5 h-5 text-stone-400 dark:text-stone-500"></ui-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-stone-700 dark:text-stone-300">Custom Report Builder</p>
              <p class="text-xs text-stone-500 dark:text-stone-400">Create custom reports, ITAX exports, and scheduled report delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent {
  reports: ReportDefinition[] = REPORT_DEFINITIONS;

  getCategoryClasses(category: string): string {
    const classes: Record<string, string> = {
      core: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      tax: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      custom: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    };
    return classes[category] || classes['core'];
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      core: 'Core Report',
      tax: 'Tax & Statutory',
      custom: 'Custom',
    };
    return labels[category] || category;
  }
}
