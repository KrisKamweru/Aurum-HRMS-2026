import { Component, OnInit, inject, signal } from '@angular/core';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { OrganizationPageStateComponent } from '../components/organization-page-state.component';
import {
  OrganizationPlan,
  OrganizationStatus,
  RebuildOrganizationSettings
} from '../data/organization-rebuild.models';
import { OrganizationRebuildDataService } from '../data/organization-rebuild.data.service';

@Component({
  selector: 'app-organization-settings-rebuild',
  standalone: true,
  imports: [UiModalComponent, DynamicFormComponent, OrganizationPageStateComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Organization Rebuild</p>
          <h1 class="text-3xl font-semibold tracking-tight">Organization Settings</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Manage core organization identity and subscription posture from live Convex data.
          </p>
        </header>

        <app-organization-page-state
          [error]="error()"
          [isLoading]="isLoading()"
          [hasData]="!!settings()"
          loadingLabel="Loading organization settings..."
          emptyTitle="No organization settings available"
          emptyMessage="No organization record was found for this account."
        />

        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-stone-600 dark:text-stone-300">
              Keep organization metadata current to maintain clean onboarding and compliance exports.
            </p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-[10px] border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/8 dark:text-stone-200 dark:hover:bg-white/10"
                [disabled]="isLoading() || isSaving()"
                (click)="refresh()"
              >
                Refresh
              </button>
              <button
                type="button"
                class="rounded-[10px] bg-burgundy-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-burgundy-600 disabled:cursor-not-allowed disabled:opacity-60"
                [disabled]="!settings() || isLoading() || isSaving()"
                (click)="openEditModal()"
              >
                Edit Settings
              </button>
            </div>
          </div>
        </section>

        @if (settings(); as current) {
        <section class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <dl class="grid gap-4 md:grid-cols-2">
              <div class="space-y-1">
                <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Organization Name</dt>
                <dd class="text-sm font-medium text-stone-800 dark:text-stone-100">{{ current.name }}</dd>
              </div>
              <div class="space-y-1">
                <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Domain</dt>
                <dd class="text-sm font-medium text-stone-800 dark:text-stone-100">{{ current.domain || 'n/a' }}</dd>
              </div>
              <div class="space-y-1">
                <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Subscription Plan</dt>
                <dd class="text-sm font-medium capitalize text-stone-800 dark:text-stone-100">{{ current.subscriptionPlan }}</dd>
              </div>
              <div class="space-y-1">
                <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Status</dt>
                <dd class="text-sm font-medium capitalize text-stone-800 dark:text-stone-100">{{ current.status }}</dd>
              </div>
            </dl>
        </section>
        }
      </div>

      <ui-modal
        [isOpen]="isEditModalOpen()"
        (isOpenChange)="isEditModalOpen.set($event)"
        [canDismiss]="true"
        [hasFooter]="false"
        width="normal"
        title="Update Organization Settings"
      >
        <app-dynamic-form
          container="modal"
          [fields]="settingsFields"
          [sections]="settingsSections"
          [steps]="settingsSteps"
          [initialValues]="editInitialValues()"
          [loading]="isSaving()"
          [showCancel]="true"
          submitLabel="Save Settings"
          (cancel)="closeEditModal()"
          (formSubmit)="submitSettings($event)"
        />
      </ui-modal>
    </main>
  `
})
export class OrganizationSettingsRebuildComponent implements OnInit {
  private readonly data = inject(OrganizationRebuildDataService);

  readonly settings = signal<RebuildOrganizationSettings | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEditModalOpen = signal(false);
  readonly editInitialValues = signal<Record<string, unknown>>({});

  readonly settingsFields: FieldConfig[] = [
    {
      name: 'name',
      label: 'Organization Name',
      type: 'text',
      sectionId: 'identity',
      required: true,
      colSpan: 2
    },
    {
      name: 'domain',
      label: 'Domain',
      type: 'text',
      sectionId: 'identity',
      placeholder: 'e.g. aurumhrms.com'
    },
    {
      name: 'subscriptionPlan',
      label: 'Subscription Plan',
      type: 'select',
      sectionId: 'subscription',
      required: true,
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Pro', value: 'pro' },
        { label: 'Enterprise', value: 'enterprise' }
      ]
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      sectionId: 'subscription',
      required: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' }
      ]
    }
  ];

  readonly settingsSections: FormSectionConfig[] = [
    {
      id: 'identity',
      title: 'Identity',
      description: 'Core organization naming and domain',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'subscription',
      title: 'Subscription',
      description: 'Plan and status controls',
      columns: { base: 1, md: 2, lg: 2 }
    }
  ];

  readonly settingsSteps: FormStepConfig[] = [
    { id: 'org-set-identity', title: 'Identity', sectionIds: ['identity'] },
    { id: 'org-set-subscription', title: 'Subscription', sectionIds: ['subscription'] }
  ];

  ngOnInit(): void {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      this.settings.set(await this.data.getOrganizationSettings());
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load organization settings.');
    } finally {
      this.isLoading.set(false);
    }
  }

  openEditModal(): void {
    const current = this.settings();
    if (!current) {
      return;
    }
    this.editInitialValues.set({
      name: current.name,
      domain: current.domain,
      subscriptionPlan: current.subscriptionPlan,
      status: current.status
    });
    this.error.set(null);
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
  }

  async submitSettings(payload: Record<string, unknown>): Promise<void> {
    const current = this.settings();
    if (!current) {
      return;
    }
    const update = {
      name: this.readText(payload, 'name'),
      domain: this.readOptionalText(payload, 'domain'),
      subscriptionPlan: this.readPlan(payload, 'subscriptionPlan'),
      status: this.readStatus(payload, 'status')
    } as const;
    const optimistic: RebuildOrganizationSettings = {
      ...current,
      ...update,
      domain: update.domain ?? ''
    };

    this.isSaving.set(true);
    this.error.set(null);
    this.settings.set(optimistic);
    try {
      await this.data.updateOrganizationSettings({
        ...update,
        expectedUpdatedAt: current.updatedAt
      });
      await this.refresh();
      this.isEditModalOpen.set(false);
    } catch (error: unknown) {
      this.settings.set(current);
      const message = error instanceof Error ? error.message : 'Unable to update organization settings.';
      if (this.isConflictMessage(message)) {
        await this.reloadLatestSettings();
        this.error.set('Organization settings were updated in another session. Latest values were reloaded; review and retry.');
      } else {
        this.error.set(message);
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  private readText(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];
    if (typeof value === 'string') {
      return value.trim();
    }
    return '';
  }

  private readOptionalText(payload: Record<string, unknown>, key: string): string | undefined {
    const value = this.readText(payload, key);
    return value.length > 0 ? value : undefined;
  }

  private readPlan(payload: Record<string, unknown>, key: string): OrganizationPlan {
    const value = payload[key];
    if (value === 'free' || value === 'pro' || value === 'enterprise') {
      return value;
    }
    return 'free';
  }

  private readStatus(payload: Record<string, unknown>, key: string): OrganizationStatus {
    const value = payload[key];
    if (value === 'active' || value === 'suspended') {
      return value;
    }
    return 'active';
  }

  private isConflictMessage(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes('conflict') || normalized.includes('stale');
  }

  private async reloadLatestSettings(): Promise<void> {
    try {
      const latest = await this.data.getOrganizationSettings();
      this.settings.set(latest);
      if (latest && this.isEditModalOpen()) {
        this.editInitialValues.set({
          name: latest.name,
          domain: latest.domain,
          subscriptionPlan: latest.subscriptionPlan,
          status: latest.status
        });
      }
    } catch {
      // Ignore secondary refresh failure to avoid masking the original save error path.
    }
  }
}
