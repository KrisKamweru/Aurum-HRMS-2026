import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-organization-settings-rebuild',
  imports: [UiModalComponent, DynamicFormComponent, OrganizationPageStateComponent],
  template: ''
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


