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
  template: ''
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
