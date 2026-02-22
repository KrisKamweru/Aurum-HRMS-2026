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
  template: `
    <main class="h-full overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-6xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Settings</p>
          <h1 class="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">General Settings</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Configure user-facing display preferences and regional formatting.
          </p>
        </header>

        @if (store.error()) {
          <section class="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {{ store.error() }}
          </section>
        }

        <section class="grid gap-4 lg:grid-cols-[1fr_320px]">
          <article class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
            @if (store.generalLoading()) {
              <div class="h-56 animate-pulse rounded-xl border border-stone-200 bg-white/70 dark:border-white/8 dark:bg-white/[0.03]"></div>
            } @else {
              <app-dynamic-form
                [fields]="formFields"
                [sections]="formSections"
                [steps]="formSteps"
                [initialValues]="initialValues()"
                [loading]="store.isSaving()"
                submitLabel="Save Preferences"
                (formSubmit)="submit($event)"
              />
            }
          </article>

          <aside class="space-y-4">
            <article class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
              <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Related Settings</h2>
              <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">Organization-wide settings and leave policies are managed in dedicated rebuilt screens.</p>
              <div class="mt-4 space-y-2">
                <a
                  routerLink="/organization/settings"
                  class="block rounded-[10px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-200 dark:hover:bg-white/10"
                >
                  Organization Settings
                </a>
                <a
                  routerLink="/settings/leave-policies"
                  class="block rounded-[10px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-200 dark:hover:bg-white/10"
                >
                  Leave Policies
                </a>
              </div>
            </article>

            <article class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
              <h2 class="text-base font-semibold text-stone-900 dark:text-stone-100">Current Snapshot</h2>
              @let settings = store.generalSettings();
              <dl class="mt-3 space-y-2 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="text-stone-500 dark:text-stone-400">Currency</dt>
                  <dd class="font-medium text-stone-800 dark:text-stone-100">{{ settings.currency }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-stone-500 dark:text-stone-400">Timezone</dt>
                  <dd class="font-medium text-stone-800 dark:text-stone-100">{{ settings.timezone }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-stone-500 dark:text-stone-400">Date Format</dt>
                  <dd class="font-medium text-stone-800 dark:text-stone-100">{{ settings.dateFormat }}</dd>
                </div>
              </dl>
            </article>
          </aside>
        </section>
      </div>
    </main>
  `
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
