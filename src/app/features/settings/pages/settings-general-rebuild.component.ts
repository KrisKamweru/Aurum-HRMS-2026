import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { RebuildDateFormat, RebuildGeneralSettings } from '../data/settings-rebuild.models';
import { SettingsRebuildStore } from '../data/settings-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-settings-general-rebuild',
  imports: [RouterLink, DynamicFormComponent],
  template: ''
})
export class SettingsGeneralRebuildComponent implements OnInit {
  readonly store = inject(SettingsRebuildStore);
  readonly initialValues = computed<Record<string, unknown>>(() => {
    const settings = this.store.generalSettings();
    return {
      currency: settings.currency,
      timezone: settings.timezone,
      dateFormat: settings.dateFormat
    };
  });

  readonly formFields: FieldConfig[] = [
    {
      name: 'currency',
      label: 'Currency Display',
      type: 'select',
      sectionId: 'display',
      required: true,
      options: [
        { label: 'USD ($)', value: 'USD' },
        { label: 'KES (KSh)', value: 'KES' },
        { label: 'EUR (€)', value: 'EUR' },
        { label: 'GBP (£)', value: 'GBP' },
        { label: 'INR (₹)', value: 'INR' }
      ]
    },
    {
      name: 'dateFormat',
      label: 'Date Format',
      type: 'select',
      sectionId: 'display',
      required: true,
      options: [
        { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
        { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
        { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
      ]
    },
    {
      name: 'timezone',
      label: 'Timezone',
      type: 'select',
      sectionId: 'locale',
      required: true,
      colSpan: 2,
      options: [
        { label: 'UTC', value: 'UTC' },
        { label: 'Africa/Nairobi', value: 'Africa/Nairobi' },
        { label: 'America/New_York', value: 'America/New_York' },
        { label: 'Europe/London', value: 'Europe/London' }
      ]
    }
  ];

  readonly formSections: FormSectionConfig[] = [
    { id: 'display', title: 'Display', description: 'Number and date presentation in the UI.', columns: { base: 1, md: 2, lg: 2 } },
    { id: 'locale', title: 'Locale', description: 'Timezone used for date and time rendering.', columns: { base: 1, md: 2, lg: 2 } }
  ];

  readonly formSteps: FormStepConfig[] = [
    { id: 'general-display', title: 'Display', sectionIds: ['display'] },
    { id: 'general-locale', title: 'Locale', sectionIds: ['locale'] }
  ];

  ngOnInit(): void {
    void this.store.loadGeneralSettings();
  }

  async submit(payload: Record<string, unknown>): Promise<void> {
    const current = this.store.generalSettings();
    const next: RebuildGeneralSettings = {
      currency: this.readRequiredText(payload, 'currency', current.currency),
      timezone: this.readRequiredText(payload, 'timezone', current.timezone),
      dateFormat: this.readDateFormat(payload['dateFormat'], current.dateFormat),
      workDays: [...current.workDays]
    };
    await this.store.saveGeneralSettings(next);
  }

  private readRequiredText(payload: Record<string, unknown>, key: string, fallback: string): string {
    const value = payload[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    return fallback;
  }

  private readDateFormat(value: unknown, fallback: RebuildDateFormat): RebuildDateFormat {
    if (value === 'MM/DD/YYYY' || value === 'DD/MM/YYYY' || value === 'YYYY-MM-DD') {
      return value;
    }
    return fallback;
  }
}
