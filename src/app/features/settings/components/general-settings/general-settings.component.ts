import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConvexClientService } from '../../../../core/services/convex-client.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { api } from '../../../../../../convex/_generated/api';
import { UiGridComponent } from '../../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../../shared/components/ui-grid/ui-grid-tile.component';

@Component({
  selector: 'app-general-settings',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    UiGridComponent,
    UiGridTileComponent
  ],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-bold text-stone-900 dark:text-white">User Preferences</h2>
        <p class="text-[13px] text-stone-600 dark:text-stone-400 mt-1">Configure your personal application preferences.</p>
      </div>

      <div class="dash-frame">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="Display Settings" variant="compact" divider="bottom">
            <div class="tile-body">
              <form [formGroup]="form" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Currency -->
                  <div class="space-y-1.5">
                    <label class="block text-[13px] font-medium text-stone-700 dark:text-stone-300">Currency Display</label>
                    <select
                      formControlName="currency"
                      class="block w-full px-4 py-2.5 rounded-lg text-sm
                             bg-white border border-stone-200
                             dark:bg-white/5 dark:border-white/8 dark:text-white
                             focus:border-burgundy-700 focus:ring-2 focus:ring-burgundy-700/20
                             transition-all"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="KES">KES (KSh)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                    <p class="text-xs text-stone-500 dark:text-stone-400">Preferred currency for display purposes.</p>
                  </div>

                  <!-- Timezone -->
                  <div class="space-y-1.5">
                    <label class="block text-[13px] font-medium text-stone-700 dark:text-stone-300">Timezone</label>
                    <select
                      formControlName="timezone"
                      class="block w-full px-4 py-2.5 rounded-lg text-sm
                             bg-white border border-stone-200
                             dark:bg-white/5 dark:border-white/8 dark:text-white
                             focus:border-burgundy-700 focus:ring-2 focus:ring-burgundy-700/20
                             transition-all"
                    >
                      <option value="UTC">UTC</option>
                      <option value="Africa/Nairobi">Africa/Nairobi</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                    </select>
                    <p class="text-xs text-stone-500 dark:text-stone-400">Your local timezone for date and time display.</p>
                  </div>

                  <!-- Date Format -->
                  <div class="space-y-1.5">
                    <label class="block text-[13px] font-medium text-stone-700 dark:text-stone-300">Date Format</label>
                    <select
                      formControlName="dateFormat"
                      class="block w-full px-4 py-2.5 rounded-lg text-sm
                             bg-white border border-stone-200
                             dark:bg-white/5 dark:border-white/8 dark:text-white
                             focus:border-burgundy-700 focus:ring-2 focus:ring-burgundy-700/20
                             transition-all"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                    <p class="text-xs text-stone-500 dark:text-stone-400">How dates should be formatted in the UI.</p>
                  </div>
                </div>

                <div class="flex justify-end pt-4 border-t border-stone-100 dark:border-white/5">
                  <button type="button" (click)="saveSettings()" [disabled]="saving()"
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

          <ui-grid-tile title="Organization Settings" variant="compact">
            <div class="tile-body">
              <p class="text-sm text-stone-600 dark:text-stone-400 mb-4">
                Organization-wide settings like work schedules and company details are managed separately.
              </p>
              <a routerLink="/organization/settings"
                 class="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                        text-burgundy-700 dark:text-burgundy-300
                        bg-burgundy-50 dark:bg-burgundy-700/12
                        border border-burgundy-200 dark:border-burgundy-700/20
                        hover:bg-burgundy-100 dark:hover:bg-burgundy-700/20
                        text-sm font-medium transition-colors">
                Go to Organization Settings
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
export class GeneralSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);

  form: FormGroup;
  saving = signal(false);
  settings = signal<any>(null);

  constructor() {
    this.form = this.fb.group({
      currency: ['USD'],
      timezone: ['UTC'],
      dateFormat: ['MM/DD/YYYY']
    });
  }

  ngOnInit() {
    const client = this.convex.getClient();
    client.onUpdate(api.settings.getSettings, {}, (data) => {
      if (data) {
        this.settings.set(data);
        this.form.patchValue({
          currency: data.currency,
          timezone: data.timezone,
          dateFormat: data.dateFormat
        }, { emitEvent: false });
      }
    });
  }

  async saveSettings() {
    this.saving.set(true);
    try {
      const formValue = this.form.value;
      const currentSettings = this.settings();
      await this.convex.getClient().mutation(api.settings.updateSettings, {
        currency: formValue.currency,
        timezone: formValue.timezone,
        dateFormat: formValue.dateFormat,
        workDays: currentSettings?.workDays || [1, 2, 3, 4, 5]
      });
      this.toast.success('Settings updated successfully');
    } catch (err: any) {
      this.toast.error('Failed to update settings');
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }
}
