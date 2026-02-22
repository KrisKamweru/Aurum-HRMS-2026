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
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Super Admin</h1>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Manage organizations, subscription plans, and global operational status.
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <ui-badge variant="success" size="sm" [rounded]="true">Active {{ activeOrganizations() }}</ui-badge>
            <ui-badge variant="warning" size="sm" [rounded]="true">Suspended {{ suspendedOrganizations() }}</ui-badge>
            <ui-badge variant="neutral" size="sm" [rounded]="true">Users {{ stats().totalUsers }}</ui-badge>
            <ui-badge variant="neutral" size="sm" [rounded]="true">Employees {{ stats().totalEmployees }}</ui-badge>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <ui-button variant="secondary" size="sm" [disabled]="loading()" (onClick)="refresh()">Refresh</ui-button>
          <ui-button variant="primary" size="sm" [disabled]="isSaving()" (onClick)="openCreateModal()">Create Organization</ui-button>
        </div>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" [disabled]="loading()" (onClick)="refresh()">Retry</ui-button>
        </section>
      }

      @if (loading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-4 w-40 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-28 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else {
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Organizations</p>
            <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ stats().totalOrganizations }}</p>
          </article>
          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Active Users</p>
            <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ stats().activeUsers }}</p>
          </article>
          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Pending Users</p>
            <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ stats().pendingUsers }}</p>
          </article>
          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Employees</p>
            <p class="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{{ stats().totalEmployees }}</p>
          </article>
        </section>

        <section class="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-white/8">
            <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Organizations</p>
            <p class="text-xs text-stone-500 dark:text-stone-400">{{ organizations().length }} total</p>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-[#eeedf0] text-xs font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.02] dark:text-stone-400">
                <tr>
                  <th class="px-4 py-3">Organization</th>
                  <th class="px-4 py-3">Plan</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3">Users</th>
                  <th class="px-4 py-3">Employees</th>
                  <th class="px-4 py-3">Pending</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (organizations().length === 0) {
                  <tr>
                    <td colspan="7" class="px-4 py-5 text-center text-stone-500 dark:text-stone-400">No organizations found.</td>
                  </tr>
                } @else {
                  @for (organization of organizations(); track organization.id) {
                    <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                      <td class="px-4 py-3">
                        <p class="font-semibold text-stone-800 dark:text-stone-100">{{ organization.name }}</p>
                        <p class="text-xs text-stone-500 dark:text-stone-400">{{ organization.domain || 'No domain' }}</p>
                      </td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ planLabel(organization.subscriptionPlan) }}</td>
                      <td class="px-4 py-3">
                        <ui-badge size="sm" [rounded]="true" [variant]="statusVariant(organization.status)">
                          {{ organization.status }}
                        </ui-badge>
                      </td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ organization.userCount }}</td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ organization.employeeCount }}</td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ organization.pendingRequestCount }}</td>
                      <td class="px-4 py-3">
                        <div class="flex justify-end gap-2">
                          <ui-button variant="outline" size="sm" [disabled]="isSaving()" (onClick)="openEditModal(organization)">
                            Edit
                          </ui-button>
                          <ui-button
                            variant="secondary"
                            size="sm"
                            [disabled]="isSaving()"
                            (onClick)="requestStatusChange(organization)"
                          >
                            {{ organization.status === 'active' ? 'Suspend' : 'Activate' }}
                          </ui-button>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      <ui-modal
        [isOpen]="isModalOpen()"
        (isOpenChange)="isModalOpen.set($event)"
        [canDismiss]="true"
        [hasFooter]="false"
        width="normal"
        [title]="isEditing() ? 'Edit Organization' : 'Create Organization'"
      >
        <app-dynamic-form
          container="modal"
          [fields]="organizationFields"
          [sections]="organizationSections"
          [steps]="organizationSteps"
          [initialValues]="formInitialValues()"
          [loading]="isSaving()"
          [showCancel]="true"
          [submitLabel]="isEditing() ? 'Save Changes' : 'Create Organization'"
          (cancel)="closeModal()"
          (formSubmit)="saveOrganization($event)"
        />
      </ui-modal>

      <ui-confirm-dialog
        [isOpen]="isStatusDialogOpen()"
        (isOpenChange)="isStatusDialogOpen.set($event)"
        [options]="statusDialogOptions()"
        (confirm)="confirmStatusChange()"
      />
    </main>
  `
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
