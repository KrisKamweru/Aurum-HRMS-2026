import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiGridComponent } from '../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../shared/components/ui-grid/ui-grid-tile.component';
import { REPORT_DEFINITIONS, ReportDefinition } from './models/report-definitions';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterLink, UiIconComponent, UiGridComponent, UiGridTileComponent],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">Reports</h1>
        <p class="mt-2 text-[15px] text-stone-600 dark:text-stone-400">
          Generate and export reports for attendance, payroll, and tax data
        </p>
      </div>

      <!-- Report Cards Grid - Wrapped in Dash Frame -->
      <div class="dash-frame">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="Available Reports" variant="compact" divider="bottom">
            <div class="tile-body">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (report of reports; track report.id) {
                  <a
                    [routerLink]="report.route"
                    class="group block"
                  >
                    <div class="h-full bg-stone-50 border border-stone-200 rounded-xl shadow-sm p-6
                                dark:bg-white/[0.03] dark:border-white/[0.06] dark:shadow-none
                                hover:border-burgundy-700 dark:hover:border-burgundy-700/50
                                hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                      <!-- Icon -->
                      <div class="w-12 h-12 rounded-xl bg-burgundy-50 dark:bg-burgundy-700/12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                        <ui-icon [name]="report.icon" class="w-6 h-6 text-burgundy-700 dark:text-burgundy-300"></ui-icon>
                      </div>

                      <!-- Content -->
                      <h3 class="text-lg font-semibold text-stone-900 dark:text-white mb-2 group-hover:text-burgundy-700 dark:group-hover:text-burgundy-300 transition-colors">
                        {{ report.name }}
                      </h3>
                      <p class="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                        {{ report.description }}
                      </p>

                      <!-- Category Badge -->
                      <div class="mt-4 flex items-center gap-2">
                        <span
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
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
                        <span class="text-sm font-semibold">View Report</span>
                        <ui-icon name="arrow-right" class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"></ui-icon>
                      </div>
                    </div>
                  </a>
                }
              </div>
            </div>
          </ui-grid-tile>

          <ui-grid-tile title="Coming Soon" variant="compact">
            <div class="tile-body">
              <div class="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-6
                          dark:bg-white/[0.03] dark:border-white/[0.06]">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg bg-stone-200 dark:bg-white/5 flex items-center justify-center">
                    <ui-icon name="sparkles" class="w-5 h-5 text-stone-400 dark:text-stone-500"></ui-icon>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-stone-700 dark:text-stone-300">Custom Report Builder</p>
                    <p class="text-xs text-stone-500 dark:text-stone-400">Create custom reports, ITAX exports, and scheduled report delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </ui-grid-tile>
        </ui-grid>
      </div>
    </div>
  `,
  styles: [`
    .dash-frame {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e7e5e4;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }

    :host-context(.dark) .dash-frame {
      background: rgb(41 37 36 / 0.6);
      border-color: rgb(68 64 60 / 0.5);
      box-shadow: none;
    }

    .tile-body {
      padding: 1.5rem;
    }
  `]
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
