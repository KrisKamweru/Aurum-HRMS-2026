import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';

interface ReportCard {
  title: string;
  description: string;
  route: string;
  icon: string;
  category: 'core' | 'tax';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reports-rebuild',
  imports: [RouterLink, UiIconComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-8 space-y-2">
        <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Reports</h1>
        <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
          Generate and export attendance, payroll, tax, and analytics report outputs.
        </p>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        @for (card of reportCards; track card.route) {
          <a
            [routerLink]="card.route"
            class="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-colors hover:border-burgundy-300 hover:bg-burgundy-50/40 dark:border-white/8 dark:bg-white/[0.04] dark:hover:border-burgundy-500/30 dark:hover:bg-burgundy-700/[0.08]"
          >
            <div class="mb-4 flex items-center justify-between">
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-burgundy-50 text-burgundy-700 dark:bg-burgundy-700/15 dark:text-burgundy-300">
                <ui-icon [name]="card.icon" class="h-5 w-5"></ui-icon>
              </div>
              <span
                class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                [class]="
                  card.category === 'tax'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-700/20 dark:text-amber-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-700/20 dark:text-blue-300'
                "
              >
                {{ card.category }}
              </span>
            </div>
            <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">{{ card.title }}</h2>
            <p class="mt-2 text-sm text-stone-600 dark:text-stone-400">{{ card.description }}</p>
          </a>
        }
      </section>
    </main>
  `
})
export class ReportsRebuildComponent {
  readonly reportCards: ReportCard[] = [
    {
      title: 'Attendance Report',
      description: 'Track statuses, hours, and timecard outcomes across selected date windows.',
      route: '/reports/attendance',
      icon: 'clock',
      category: 'core'
    },
    {
      title: 'Payroll Report',
      description: 'Review gross, deductions, and net pay for completed payroll runs.',
      route: '/reports/payroll',
      icon: 'banknotes',
      category: 'core'
    },
    {
      title: 'Tax Report',
      description: 'Inspect PAYE, NSSF, NHIF, and housing levy contributions per employee.',
      route: '/reports/tax',
      icon: 'document-text',
      category: 'tax'
    },
    {
      title: 'Workforce Analytics',
      description: 'Monitor headcount, attrition, leave liability, and payroll variance trends.',
      route: '/reports/analytics',
      icon: 'chart-bar',
      category: 'core'
    }
  ];
}
