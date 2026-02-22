import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { BadgeVariant, UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { OrganizationStatus, SuperAdminOrganization } from '../data/super-admin-rebuild.models';
import { SuperAdminRebuildStore } from '../data/super-admin-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-super-admin-rebuild',
  imports: [UiBadgeComponent, UiButtonComponent, UiModalComponent, DynamicFormComponent, UiConfirmDialogComponent],
  template: ''
})
export class SuperAdminRebuildComponent implements OnInit {
  private readonly store = inject(SuperAdminRebuildStore);

  readonly organizations = this.store.organizations;
  readonly stats = this.store.stats;
  readonly loading = this.store.loading;
  readonly isSaving = this.store.isSaving;
  readonly error = this.store.error;
  readonly activeOrganizations = this.store.activeOrganizations;
  readonly suspendedOrganizations = this.store.suspendedOrganizations;

  readonly isModalOpen = signal(false);
  readonly isStatusDialogOpen = signal(false);
  readonly editingOrganizationId = signal<string | null>(null);
  readonly formInitialValues = signal<Record<string, unknown>>({});
  readonly pendingStatusOrg = signal<SuperAdminOrganization | null>(null);

  readonly organizationSections: FormSectionConfig[] = [
    {
      id: 'organization',
      title: 'Organization',
      description: 'Identity and subscription metadata',
      columns: { base: 1, md: 2, lg: 2 }
    }
  ];

  readonly organizationSteps: FormStepConfig[] = [{ id: 'organization-step-1', title: 'Organization', sectionIds: ['organization'] }];

  readonly organizationFields: FieldConfig[] = [
    { name: 'name', label: 'Organization Name', type: 'text', sectionId: 'organization', required: true, colSpan: 2 },
    { name: 'domain', label: 'Domain', type: 'text', sectionId: 'organization', required: false, hint: 'Example: aurumhrms.com' },
    {
      name: 'subscriptionPlan',
      label: 'Subscription Plan',
      type: 'select',
      sectionId: 'organization',
      required: true,
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Pro', value: 'pro' },
        { label: 'Enterprise', value: 'enterprise' }
      ]
    }
  ];

  readonly isEditing = computed(() => this.editingOrganizationId() !== null);

  readonly statusDialogOptions = computed<ConfirmDialogOptions>(() => {
    const organization = this.pendingStatusOrg();
    const nextStatus: OrganizationStatus = organization?.status === 'active' ? 'suspended' : 'active';
    const action = nextStatus === 'active' ? 'Activate' : 'Suspend';
    return {
      title: `${action} Organization`,
      message: organization ? `${action} ${organization.name}?` : `${action} organization?`,
      confirmText: action,
      cancelText: 'Cancel',
      variant: nextStatus === 'active' ? 'info' : 'warning'
    };
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    void this.store.loadDashboard();
  }

  openCreateModal(): void {
    this.editingOrganizationId.set(null);
    this.formInitialValues.set({ subscriptionPlan: 'free' });
    this.store.clearError();
    this.isModalOpen.set(true);
  }

  openEditModal(organization: SuperAdminOrganization): void {
    this.editingOrganizationId.set(organization.id);
    this.formInitialValues.set({
      name: organization.name,
      domain: organization.domain ?? '',
      subscriptionPlan: organization.subscriptionPlan
    });
    this.store.clearError();
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingOrganizationId.set(null);
  }

  async saveOrganization(payload: Record<string, unknown>): Promise<void> {
    const subscriptionPlan = this.readPlan(payload['subscriptionPlan']);
    if (!subscriptionPlan) {
      return;
    }

    const draft = {
      name: this.readText(payload, 'name'),
      domain: this.readText(payload, 'domain'),
      subscriptionPlan
    };

    if (this.isEditing()) {
      const success = await this.store.updateOrganization({
        id: this.editingOrganizationId() ?? '',
        ...draft
      });
      if (success) {
        this.closeModal();
      }
      return;
    }

    const success = await this.store.createOrganization(draft);
    if (success) {
      this.closeModal();
    }
  }

  requestStatusChange(organization: SuperAdminOrganization): void {
    this.pendingStatusOrg.set(organization);
    this.store.clearError();
    this.isStatusDialogOpen.set(true);
  }

  async confirmStatusChange(): Promise<void> {
    const organization = this.pendingStatusOrg();
    if (!organization) {
      return;
    }
    const nextStatus: OrganizationStatus = organization.status === 'active' ? 'suspended' : 'active';
    const success = await this.store.setOrganizationStatus(organization.id, nextStatus);
    if (success) {
      this.pendingStatusOrg.set(null);
      this.isStatusDialogOpen.set(false);
    }
  }

  statusVariant(status: OrganizationStatus): BadgeVariant {
    return status === 'active' ? 'success' : 'warning';
  }

  planLabel(value: string): string {
    if (value === 'free') {
      return 'Free';
    }
    if (value === 'pro') {
      return 'Pro';
    }
    if (value === 'enterprise') {
      return 'Enterprise';
    }
    return value;
  }

  private readText(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];
    return typeof value === 'string' ? value : '';
  }

  private readPlan(value: unknown): 'free' | 'pro' | 'enterprise' | null {
    if (value === 'free' || value === 'pro' || value === 'enterprise') {
      return value;
    }
    return null;
  }
}
