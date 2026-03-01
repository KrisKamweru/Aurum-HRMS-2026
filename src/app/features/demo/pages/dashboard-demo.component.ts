import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiAvatarComponent } from '../../../shared/components/ui-avatar/ui-avatar.component';
import { UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-demo',
  imports: [UiCardComponent, UiButtonComponent, UiAvatarComponent, UiBadgeComponent],
  template: `
    <div class="space-y-2 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-display font-semibold text-slate-900 dark:text-white">HRMS Overview</h1>
          <p class="text-slate-500 font-medium mt-1">Welcome back, Sarah. Here's what's happening today.</p>
        </div>
        <div class="flex gap-3">
          <ui-button variant="secondary" icon="check">Approve Time-offs</ui-button>
          <ui-button variant="primary" icon="inbox">View Reports</ui-button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <ui-card variant="glass" padding="lg" accent="primary" title="Total Employees" subtitle="+12% from last month">
          <div class="text-4xl font-display font-bold text-slate-800 dark:text-slate-100">1,248</div>
        </ui-card>
        
        <ui-card variant="glass" padding="lg" title="Pending Leave Requests" subtitle="Action required">
          <div class="flex items-center justify-between mt-2">
            <div class="text-4xl font-display font-bold text-slate-800 dark:text-slate-100">14</div>
            <ui-badge variant="warning">High Priority</ui-badge>
          </div>
        </ui-card>
        
        <ui-card variant="glass" padding="lg" title="Upcoming Appraisals" subtitle="Next 30 days">
          <div class="flex items-center justify-between mt-2">
            <div class="text-4xl font-display font-bold text-slate-800 dark:text-slate-100">8</div>
            <div class="flex -space-x-3">
              <ui-avatar name="John Doe" size="md"></ui-avatar>
              <ui-avatar name="Jane Smith" size="md"></ui-avatar>
              <ui-avatar name="Alice Jones" size="md"></ui-avatar>
            </div>
          </div>
        </ui-card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <div class="lg:col-span-2">
          <ui-card variant="interactive" title="Recent Activity" subtitle="Your team's latest updates">
            <div class="space-y-2 mt-4">
              <div class="flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-[var(--color-bg-surface-elevated)] cursor-pointer border border-transparent hover:border-black/5 dark:hover:border-white/10">
                <ui-avatar name="Michael Chen" status="online"></ui-avatar>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">Michael Chen requested sick leave</p>
                  <p class="text-xs text-slate-500 font-medium">2 hours ago</p>
                </div>
                <ui-badge variant="neutral">Pending</ui-badge>
              </div>
              <div class="flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-[var(--color-bg-surface-elevated)] cursor-pointer border border-transparent hover:border-black/5 dark:hover:border-white/10">
                <ui-avatar name="Emily Watson" status="busy"></ui-avatar>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">Emily Watson updated her quarterly OKRs</p>
                  <p class="text-xs text-slate-500 font-medium">5 hours ago</p>
                </div>
                <ui-badge variant="success">Updated</ui-badge>
              </div>
              <div class="flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-[var(--color-bg-surface-elevated)] cursor-pointer border border-transparent hover:border-black/5 dark:hover:border-white/10">
                <ui-avatar name="David Kim" status="away"></ui-avatar>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">David Kim completed onboarding</p>
                  <p class="text-xs text-slate-500 font-medium">1 day ago</p>
                </div>
                <ui-badge variant="info">Completed</ui-badge>
              </div>
            </div>
          </ui-card>
        </div>
        <div>
          <ui-card variant="interactive" title="Quick Actions">
            <div class="flex flex-col gap-3 mt-4">
              <button class="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--color-bg-surface-elevated)] border border-black/5 dark:border-white/10 hover:bg-[var(--color-bg-surface-hover)] transition-colors text-left group">
                <span class="font-semibold text-sm text-slate-800 dark:text-slate-200">Onboard New Hire</span>
                <span class="text-slate-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </button>
              <button class="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--color-bg-surface-elevated)] border border-black/5 dark:border-white/10 hover:bg-[var(--color-bg-surface-hover)] transition-colors text-left group">
                <span class="font-semibold text-sm text-slate-800 dark:text-slate-200">Run Payroll</span>
                <span class="text-slate-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </button>
              <button class="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--color-bg-surface-elevated)] border border-black/5 dark:border-white/10 hover:bg-[var(--color-bg-surface-hover)] transition-colors text-left group">
                <span class="font-semibold text-sm text-slate-800 dark:text-slate-200">Manage Benefits</span>
                <span class="text-slate-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </button>
            </div>
          </ui-card>
        </div>
      </div>
    </div>
  `
})
export class DashboardDemoComponent {}
