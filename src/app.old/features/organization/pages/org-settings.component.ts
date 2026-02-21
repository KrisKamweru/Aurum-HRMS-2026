import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { ToastService } from '../../../shared/services/toast.service';
import { api } from '../../../../../convex/_generated/api';
import { UiGridComponent } from '../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../shared/components/ui-grid/ui-grid-tile.component';

@Component({
  selector: 'app-org-settings',
  imports: [CommonModule, RouterLink, UiGridComponent, UiGridTileComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">Organization Settings</h1>
        <p class="text-[15px] text-stone-600 dark:text-stone-400 mt-2">Configure organization-wide work schedule and policies.</p>
      </div>

      <div class="dash-frame">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="Work Schedule" variant="compact" divider="bottom">
            <div class="tile-body">
              <p class="text-xs text-stone-500 dark:text-stone-400 mb-4">Define standard working days for your organization</p>
              <form (ngSubmit)="saveSchedule()" class="space-y-6">
                <div class="space-y-3">
                  <label class="block text-[13px] font-medium text-stone-700 dark:text-stone-300">Working Days</label>
                  <div class="flex flex-wrap gap-3">
                    @for (day of daysOfWeek; track day.value) {
                      <label class="flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-lg border
                                    hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
                             [class.bg-burgundy-50]="isWorkDay(day.value)"
                             [class.dark:bg-burgundy-700/12]="isWorkDay(day.value)"
                             [class.border-burgundy-200]="isWorkDay(day.value)"
                             [class.dark:border-burgundy-700/20]="isWorkDay(day.value)"
                             [class.border-stone-200]="!isWorkDay(day.value)"
                             [class.dark:border-white/8]="!isWorkDay(day.value)">
                        <input
                          type="checkbox"
                          [checked]="isWorkDay(day.value)"
                          (change)="toggleWorkDay(day.value)"
                          class="rounded text-burgundy-700 focus:ring-burgundy-700 border-stone-300 dark:border-stone-600"
                        />
                        <span class="text-sm font-medium text-stone-700 dark:text-stone-300">{{ day.label }}</span>
                      </label>
                    }
                  </div>
                  <p class="text-xs text-stone-500 dark:text-stone-400">Select the standard working days for your organization.</p>
                </div>

                <div class="flex justify-end pt-4 border-t border-stone-100 dark:border-white/5">
                  <button type="submit" [disabled]="saving()"
                    class="px-6 py-2.5 rounded-lg text-sm font-medium
                           bg-burgundy-700 text-white
                           hover:bg-burgundy-800 active:bg-burgundy-900
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors">
                    {{ saving() ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
              </form>
            </div>
          </ui-grid-tile>

          <ui-grid-tile title="Leave Policies" variant="compact">
            <div class="tile-body">
              <p class="text-sm text-stone-600 dark:text-stone-400">
                Configure leave types, entitlements, and approval workflows.
              </p>
              <a routerLink="/settings/leave-policies"
                 class="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg
                        text-burgundy-700 dark:text-burgundy-300
                        bg-burgundy-50 dark:bg-burgundy-700/12
                        border border-burgundy-200 dark:border-burgundy-700/20
                        hover:bg-burgundy-100 dark:hover:bg-burgundy-700/20
                        text-sm font-medium transition-colors">
                Manage Leave Policies
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
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
export class OrgSettingsComponent implements OnInit {
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);

  saving = signal(false);

  daysOfWeek = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 }
  ];

  selectedWorkDays = signal<number[]>([1, 2, 3, 4, 5]);

  ngOnInit() {
    this.loadOrgData();
  }

  async loadOrgData() {
    const client = this.convex.getClient();
    client.onUpdate(api.settings.getSettings, {}, (data) => {
      if (data && data.workDays) {
        this.selectedWorkDays.set(data.workDays);
      }
    });
  }

  isWorkDay(day: number): boolean {
    return this.selectedWorkDays().includes(day);
  }

  toggleWorkDay(day: number) {
    const current = this.selectedWorkDays();
    if (current.includes(day)) {
      this.selectedWorkDays.set(current.filter(d => d !== day));
    } else {
      this.selectedWorkDays.set([...current, day].sort());
    }
  }

  async saveSchedule() {
    this.saving.set(true);
    try {
      const settings = await this.convex.getClient().query(api.settings.getSettings, {});
      await this.convex.getClient().mutation(api.settings.updateSettings, {
        currency: settings?.currency || 'USD',
        timezone: settings?.timezone || 'UTC',
        dateFormat: settings?.dateFormat || 'MM/DD/YYYY',
        workDays: this.selectedWorkDays()
      });
      this.toast.success('Work schedule updated successfully');
    } catch (err: any) {
      this.toast.error('Failed to update work schedule');
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }
}
