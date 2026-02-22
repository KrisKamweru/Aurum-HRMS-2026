import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { CoreHrRecordType } from '../data/core-hr-rebuild.models';
import { CoreHrRebuildStore } from '../data/core-hr-rebuild.store';

interface CoreHrModuleCard {
  type: CoreHrRecordType;
  title: string;
  description: string;
  route: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-core-hr-rebuild',
  imports: [UiBadgeComponent, UiButtonComponent],
  template: ''
})
export class CoreHrRebuildComponent implements OnInit {
  private readonly store = inject(CoreHrRebuildStore);
  private readonly router = inject(Router);

  readonly employees = this.store.employees;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly pendingResignations = this.store.pendingResignations;
  readonly recordCounts = this.store.recordCounts;

  readonly modules: CoreHrModuleCard[] = [
    {
      type: 'promotions',
      title: 'Promotions',
      description: 'Role advancement and compensation progression records.',
      route: '/core-hr/promotions'
    },
    {
      type: 'transfers',
      title: 'Transfers',
      description: 'Department and location movement records.',
      route: '/core-hr/transfers'
    },
    {
      type: 'awards',
      title: 'Awards',
      description: 'Recognition events and discretionary rewards.',
      route: '/core-hr/awards'
    },
    {
      type: 'warnings',
      title: 'Warnings',
      description: 'Disciplinary notices with severity tracking.',
      route: '/core-hr/warnings'
    },
    {
      type: 'resignations',
      title: 'Resignations',
      description: 'Voluntary exits and approval workflow tracking.',
      route: '/core-hr/resignations'
    },
    {
      type: 'terminations',
      title: 'Terminations',
      description: 'Involuntary and voluntary termination records.',
      route: '/core-hr/terminations'
    },
    {
      type: 'complaints',
      title: 'Complaints',
      description: 'Employee relations cases and grievance intake.',
      route: '/core-hr/complaints'
    },
    {
      type: 'travel',
      title: 'Travel',
      description: 'Business travel requests and budget visibility.',
      route: '/core-hr/travel'
    }
  ];

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    void this.store.loadOverview();
  }

  openModule(route: string): void {
    void this.router.navigate([route]);
  }

  count(type: CoreHrRecordType): number {
    return this.recordCounts()[type];
  }
}
