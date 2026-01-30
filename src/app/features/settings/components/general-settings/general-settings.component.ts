import { Component, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { ConvexClientService } from '../../../../core/services/convex-client.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { api } from '../../../../../../convex/_generated/api';

@Component({
  selector: 'app-general-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiCardComponent,
    UiButtonComponent
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-stone-900 dark:text-white">General Settings</h2>
          <p class="text-stone-500 dark:text-stone-400 text-sm">Configure global settings for your organization.</p>
        </div>
        <ui-button (onClick)="saveSettings()" [loading]="saving()">
          Save Changes
        </ui-button>
      </div>

      <ui-card>
        <form [formGroup]="form" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Currency -->
            <div class="space-y-1">
              <label class="block text-sm font-medium text-stone-700 dark:text-stone-300">Default Currency</label>
              <select
                formControlName="currency"
                class="block w-full rounded-xl border-stone-200 dark:border-stone-700 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] bg-stone-50/50 dark:bg-stone-800/50 dark:text-stone-100"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="KES">KES (KSh)</option>
                <option value="INR">INR (₹)</option>
                <!-- Add more as needed -->
              </select>
              <p class="text-xs text-stone-500">Used for payroll and expense calculations.</p>
            </div>

            <!-- Timezone -->
            <div class="space-y-1">
              <label class="block text-sm font-medium text-stone-700 dark:text-stone-300">Timezone</label>
              <select
                formControlName="timezone"
                class="block w-full rounded-xl border-stone-200 dark:border-stone-700 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] bg-stone-50/50 dark:bg-stone-800/50 dark:text-stone-100"
              >
                <option value="UTC">UTC</option>
                <option value="Africa/Nairobi">Africa/Nairobi</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <!-- Add more as needed or use a library -->
              </select>
            </div>

            <!-- Date Format -->
            <div class="space-y-1">
              <label class="block text-sm font-medium text-stone-700 dark:text-stone-300">Date Format</label>
              <select
                formControlName="dateFormat"
                class="block w-full rounded-xl border-stone-200 dark:border-stone-700 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] bg-stone-50/50 dark:bg-stone-800/50 dark:text-stone-100"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>

          <div class="border-t border-stone-100 dark:border-stone-700 pt-6">
            <h3 class="text-sm font-bold text-stone-900 dark:text-stone-100 mb-4">Work Week</h3>
            <div class="flex flex-wrap gap-4">
              @for (day of daysOfWeek; track day.value) {
                <label class="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors" [class.bg-stone-50]="isWorkDay(day.value)" [class.dark:bg-stone-800]="isWorkDay(day.value)">
                  <input
                    type="checkbox"
                    [checked]="isWorkDay(day.value)"
                    (change)="toggleWorkDay(day.value)"
                    class="rounded text-[#8b1e3f] focus:ring-[#8b1e3f] border-stone-300 dark:border-stone-600 dark:bg-stone-700"
                  />
                  <span class="text-sm font-medium text-stone-700 dark:text-stone-300">{{ day.label }}</span>
                </label>
              }
            </div>
            <p class="text-xs text-stone-500 mt-2">Select the standard working days for your organization.</p>
          </div>
        </form>
      </ui-card>
    </div>
  `
})
export class GeneralSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);

  form: FormGroup;
  saving = signal(false);
  settings = signal<any>(null);

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
        this.selectedWorkDays.set(data.workDays || []);
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

  async saveSettings() {
    this.saving.set(true);
    try {
      const formValue = this.form.value;
      await this.convex.getClient().mutation(api.settings.updateSettings, {
        currency: formValue.currency,
        timezone: formValue.timezone,
        dateFormat: formValue.dateFormat,
        workDays: this.selectedWorkDays()
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
